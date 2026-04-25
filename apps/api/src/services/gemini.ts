import { env } from '../env';
import { logger } from '../logger';
import { retrieveChunks, type RetrievedChunk } from './retrieval';

/**
 * Gemini 2.5 Flash wrapper with Function Calling.
 *
 * The agent is given exactly one tool: `retrieve_chunks`. The model decides
 * how many times to call it, with what sub-queries, and when to stop. We cap
 * the tool loop at 5 iterations to avoid runaway costs.
 *
 * If GOOGLE_AI_STUDIO_API_KEY is missing we fall back to a deterministic mock
 * that picks the top-N chunks via retrieval and composes a templated answer
 * with [1][2] citations — enough for the demo pipeline to run.
 */

export interface AgenticQueryArgs {
  queryText: string;
  maxChunks: number;
}

export interface AgenticQueryResult {
  answer: string;
  chunksUsed: Array<{
    chunkId: string;
    citationNumber: number;
    snippet: string;
    researcherName: string;
    researcherId: string;
    uploadTitle: string;
    tier: 'open' | 'validated' | 'dark';
    commitment: string | null;
  }>;
}

const SYSTEM_INSTRUCTION = `You are a research assistant with access to a paywalled corpus of unpublished negative research results. When you need evidence, call the retrieve_chunks function. You may call it multiple times with refined sub-queries. Compose your final answer grounded only in the retrieved chunks. Cite each claim with [1], [2], etc. — the citation number must correspond to the order the chunk was first retrieved in your conversation. Be concise: 3–6 short paragraphs.`;

const TOOL_SCHEMA = {
  name: 'retrieve_chunks',
  description:
    'Search the Luqman corpus of unpublished negative research results. Returns the most relevant text chunks. Call multiple times with refined sub-queries as needed.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural-language sub-query.' },
      max_chunks: { type: 'integer', description: 'Max chunks to return (1–10).' },
      tier_preference: {
        type: 'string',
        enum: ['open', 'validated', 'dark', 'any'],
        description: 'Which pricing tier to prefer.',
      },
    },
    required: ['query', 'max_chunks'],
  },
};

interface ToolCall {
  name: string;
  args: { query: string; max_chunks: number; tier_preference?: string };
}

function buildCitationMap(retrieved: RetrievedChunk[]): Map<string, number> {
  const map = new Map<string, number>();
  let n = 1;
  for (const c of retrieved) {
    if (!map.has(c.chunkId)) map.set(c.chunkId, n++);
  }
  return map;
}

async function runMockLoop(args: AgenticQueryArgs): Promise<AgenticQueryResult> {
  logger.warn('gemini: mock agent loop (GOOGLE_AI_STUDIO_API_KEY missing)');
  const chunks = await retrieveChunks({ query: args.queryText, maxChunks: args.maxChunks });
  if (chunks.length === 0) {
    return { answer: 'No relevant chunks found for this query.', chunksUsed: [] };
  }
  const citations = buildCitationMap(chunks);
  const bullets = chunks.map((c, i) => {
    const n = citations.get(c.chunkId)!;
    const snippet = c.content.trim().slice(0, 240).replace(/\s+/g, ' ');
    return `[${n}] ${snippet}…`;
  });
  const answer = `Based on the retrieved dark-corpus evidence:\n\n${bullets.slice(0, 5).join('\n\n')}\n\n(Deterministic mock — plug in a Gemini API key to see real agent reasoning.)`;

  return {
    answer,
    chunksUsed: chunks.map((c) => ({
      chunkId: c.chunkId,
      citationNumber: citations.get(c.chunkId)!,
      snippet: c.content.slice(0, 400),
      researcherName: c.researcherName,
      researcherId: c.researcherId,
      uploadTitle: c.uploadTitle,
      tier: c.tier,
      commitment: c.commitment,
    })),
  };
}

/**
 * Real Gemini loop. Uses the @google/genai SDK's function-calling surface.
 * Kept resilient: if the SDK shape doesn't match at runtime (versions drift),
 * falls back to the mock loop with a loud warning.
 */
export async function runAgenticQuery(args: AgenticQueryArgs): Promise<AgenticQueryResult> {
  if (!env.GOOGLE_AI_STUDIO_API_KEY) return runMockLoop(args);

  try {
    const mod = await import('@google/genai');
    const GoogleGenAI = (mod as { GoogleGenAI?: any }).GoogleGenAI;
    if (!GoogleGenAI) throw new Error('@google/genai GoogleGenAI export missing');

    const client = new GoogleGenAI({ apiKey: env.GOOGLE_AI_STUDIO_API_KEY });

    const history: any[] = [{ role: 'user', parts: [{ text: args.queryText }] }];
    const allRetrieved: RetrievedChunk[] = [];

    for (let iter = 0; iter < 5; iter++) {
      const res = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: history,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [TOOL_SCHEMA] }],
          temperature: 0.2,
        },
      });

      const candidate = res.candidates?.[0];
      const parts: any[] = candidate?.content?.parts ?? [];

      const toolCalls: ToolCall[] = [];
      let textOut = '';
      for (const p of parts) {
        if (p.functionCall) {
          toolCalls.push({
            name: p.functionCall.name,
            args: p.functionCall.args,
          });
        } else if (typeof p.text === 'string') {
          textOut += p.text;
        }
      }

      if (toolCalls.length === 0) {
        // Final answer.
        const citations = buildCitationMap(allRetrieved);
        const chunksUsed = [];
        // Only include chunks whose citation number appears in textOut.
        for (const [chunkId, n] of citations.entries()) {
          const tag = `[${n}]`;
          if (textOut.includes(tag)) {
            const c = allRetrieved.find((x) => x.chunkId === chunkId)!;
            chunksUsed.push({
              chunkId,
              citationNumber: n,
              snippet: c.content.slice(0, 400),
              researcherName: c.researcherName,
              researcherId: c.researcherId,
              uploadTitle: c.uploadTitle,
              tier: c.tier,
              commitment: c.commitment,
            });
          }
        }
        if (chunksUsed.length === 0) {
          // Fall back to including all retrieved — better than empty citations.
          for (const c of allRetrieved) {
            chunksUsed.push({
              chunkId: c.chunkId,
              citationNumber: citations.get(c.chunkId)!,
              snippet: c.content.slice(0, 400),
              researcherName: c.researcherName,
              researcherId: c.researcherId,
              uploadTitle: c.uploadTitle,
              tier: c.tier,
              commitment: c.commitment,
            });
          }
        }
        return { answer: textOut.trim() || 'No answer produced.', chunksUsed };
      }

      // Append model turn then execute tool calls.
      history.push({ role: 'model', parts });

      const toolResponseParts: any[] = [];
      for (const call of toolCalls) {
        if (call.name !== 'retrieve_chunks') {
          toolResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { error: 'unknown function' },
            },
          });
          continue;
        }
        const maxN = Math.min(Math.max(call.args.max_chunks ?? 5, 1), 10);
        const tier = (call.args.tier_preference as any) ?? 'any';
        const chunks = await retrieveChunks({
          query: call.args.query,
          maxChunks: maxN,
          tierPreference: tier,
        });
        const citations = buildCitationMap([...allRetrieved, ...chunks]);
        for (const c of chunks) {
          if (!allRetrieved.find((x) => x.chunkId === c.chunkId)) allRetrieved.push(c);
        }
        toolResponseParts.push({
          functionResponse: {
            name: 'retrieve_chunks',
            response: {
              chunks: chunks.map((c) => ({
                citation: citations.get(c.chunkId),
                chunk_id: c.chunkId,
                upload_title: c.uploadTitle,
                // Dark tier: Gemini sees only the commitment hash, not the real
                // researcher name. This prevents the model from ranking papers
                // by institutional prestige — the core Zeko Dark Knowledge guarantee.
                researcher: c.tier === 'dark'
                  ? `[anonymous · Zeko commitment: ${c.commitment}]`
                  : c.researcherName,
                tier: c.tier,
                excerpt: c.content.slice(0, 900),
              })),
            },
          },
        });
      }
      history.push({ role: 'tool', parts: toolResponseParts });
    }

    logger.warn('gemini: hit 5-iteration cap without final text; returning best-effort');
    return runMockLoop(args);
  } catch (err) {
    logger.error({ err }, 'gemini: real-mode failed, falling back to mock');
    return runMockLoop(args);
  }
}
