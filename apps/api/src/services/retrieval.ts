import { createHash } from 'node:crypto';
import { db } from '../db/client';
import { chunks, uploads, researchers } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Derive a deterministic ZK-style commitment from a researcher's wallet address.
 * In production this would be a real o1js Poseidon hash submitted to the Zeko
 * Mina L2. For the demo it's sha256(walletAddress) truncated to 20 bytes — same
 * structural properties (one-way, collision-resistant, deterministic) without
 * requiring an on-chain transaction during the hackathon.
 */
export function deriveCommitment(walletAddress: string): string {
  return '0x' + createHash('sha256').update(walletAddress).digest('hex').slice(0, 40);
}

/**
 * Level-1 keyword retrieval. No embeddings.
 *
 * Algorithm:
 *   1. Tokenise the query: lowercase, split on non-alphanumeric, drop stopwords,
 *      drop tokens shorter than 3 chars.
 *   2. For each chunk, count how many of its keyword_vector tokens overlap
 *      with the query tokens (set intersection cardinality).
 *   3. Score = overlap_count / sqrt(chunk_token_count). Length-normalised so
 *      long chunks don't trivially dominate.
 *   4. Tie-break by chunk.id ascending so results are deterministic across
 *      runs — essential for a reproducible demo video.
 *   5. Return top N with a recorded relevance score.
 */

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'has', 'was', 'were',
  'with', 'from', 'that', 'this', 'what', 'when', 'where', 'which', 'why', 'how', 'who',
  'have', 'been', 'into', 'than', 'then', 'they', 'their', 'there', 'them', 'our', 'out',
  'any', 'does', 'did', 'do', 'of', 'in', 'to', 'on', 'is', 'it', 'as', 'at', 'by', 'be',
  'or', 'an', 'a', 'i', 'we', 'us', 'its', 'his', 'her', 'him', 'she', 'he', 'me', 'my',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Build the keyword vector stored in `chunks.keyword_vector` at seed time. */
export function buildKeywordVector(content: string): string {
  const tokens = new Set(tokenize(content));
  return Array.from(tokens).sort().join(' ');
}

export interface RetrievedChunk {
  chunkId: string;
  uploadId: string;
  researcherId: string;
  researcherName: string;       // real name — used for payment routing only
  researcherWallet: string;     // real wallet — used for payment routing only
  commitment: string | null;    // set for dark tier: H(wallet) — what Gemini sees
  uploadTitle: string;
  tier: 'open' | 'validated' | 'dark';
  content: string;
  relevance: number;
  position: number;
}

export interface RetrievalOptions {
  query: string;
  maxChunks: number;
  tierPreference?: 'open' | 'validated' | 'dark' | 'any';
}

/**
 * Run keyword retrieval against the DB. Loads all chunks (fine at hackathon
 * scale — low thousands of rows); in production swap in pgvector or a real
 * search index. Deterministic ordering is part of the contract.
 */
export async function retrieveChunks(opts: RetrievalOptions): Promise<RetrievedChunk[]> {
  const queryTokens = new Set(tokenize(opts.query));
  if (queryTokens.size === 0) return [];

  const rows = await db
    .select({
      chunkId: chunks.id,
      uploadId: chunks.uploadId,
      position: chunks.position,
      content: chunks.content,
      tokenCount: chunks.tokenCount,
      keywordVector: chunks.keywordVector,
      researcherId: uploads.researcherId,
      researcherName: researchers.displayName,
      researcherWallet: researchers.walletAddress,
      uploadTitle: uploads.title,
      tier: uploads.tier,
    })
    .from(chunks)
    .innerJoin(uploads, eq(chunks.uploadId, uploads.id))
    .innerJoin(researchers, eq(uploads.researcherId, researchers.id));

  const scored: Array<RetrievedChunk & { score: number }> = [];

  for (const row of rows) {
    if (
      opts.tierPreference &&
      opts.tierPreference !== 'any' &&
      row.tier !== opts.tierPreference
    ) {
      continue;
    }

    const chunkTokens = row.keywordVector ? row.keywordVector.split(/\s+/) : [];
    let overlap = 0;
    for (const t of chunkTokens) if (queryTokens.has(t)) overlap += 1;
    if (overlap === 0) continue;

    const denom = Math.sqrt(Math.max(row.tokenCount, 1));
    const score = overlap / denom;

    scored.push({
      chunkId: row.chunkId,
      uploadId: row.uploadId,
      researcherId: row.researcherId,
      researcherName: row.researcherName,
      researcherWallet: row.researcherWallet,
      commitment: row.tier === 'dark' ? deriveCommitment(row.researcherWallet) : null,
      uploadTitle: row.uploadTitle,
      tier: row.tier as 'open' | 'validated' | 'dark',
      content: row.content,
      relevance: Number(score.toFixed(6)),
      position: row.position,
      score,
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.chunkId < b.chunkId ? -1 : a.chunkId > b.chunkId ? 1 : 0;
  });

  return scored.slice(0, opts.maxChunks).map(({ score, ...rest }) => rest);
}

/**
 * Batch-load chunks by id, preserving order. Used when Gemini echoes chunk_ids
 * in its final answer and we need to enrich for the response citations.
 */
export async function loadChunksByIds(ids: string[]): Promise<RetrievedChunk[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      chunkId: chunks.id,
      uploadId: chunks.uploadId,
      position: chunks.position,
      content: chunks.content,
      tokenCount: chunks.tokenCount,
      researcherId: uploads.researcherId,
      researcherName: researchers.displayName,
      researcherWallet: researchers.walletAddress,
      uploadTitle: uploads.title,
      tier: uploads.tier,
    })
    .from(chunks)
    .innerJoin(uploads, eq(chunks.uploadId, uploads.id))
    .innerJoin(researchers, eq(uploads.researcherId, researchers.id))
    .where(inArray(chunks.id, ids));

  const byId = new Map(rows.map((r) => [r.chunkId, r]));
  const out: RetrievedChunk[] = [];
  for (const id of ids) {
    const r = byId.get(id);
    if (!r) continue;
    out.push({
      chunkId: r.chunkId,
      uploadId: r.uploadId,
      researcherId: r.researcherId,
      researcherName: r.researcherName,
      researcherWallet: r.researcherWallet,
      commitment: r.tier === 'dark' ? deriveCommitment(r.researcherWallet) : null,
      uploadTitle: r.uploadTitle,
      tier: r.tier as 'open' | 'validated' | 'dark',
      content: r.content,
      relevance: 1,
      position: r.position,
    });
  }
  return out;
}
