import { randomUUID } from 'node:crypto';
import { env } from '../src/env';
import { logger } from '../src/logger';
import { sql as sqlClient } from '../src/db/client';

/**
 * Drives 15 pre-written queries through POST /query. Each query costs ~5 chunks
 * ≈ 5 on-chain payments, yielding ~75 transactions total. That satisfies the
 * hackathon's "≥50 on-chain txs" requirement.
 *
 * Usage:
 *   1. pnpm dev   (in another terminal)
 *   2. pnpm demo
 */

const QUERIES = [
  'What dosages of compound XYZ-441 have failed in phase I oncology trials?',
  'Which battery cathode formulations showed unexpected capacity fade above 45°C?',
  'Documented BERT-base fine-tuning reproducibility failures with learning rate 3e-4.',
  'Failure modes of silicon-graphite composite anodes under fast charging.',
  'Known off-target CYP3A4 inhibition issues with BRF-119 analogues.',
  'Mode collapse patterns observed in GAN training for medical imaging.',
  'Solid-state electrolyte interface resistance problems with LiNi0.8Mn0.1Co0.1O2.',
  'Unpublished ligand-receptor binding assays that failed for GPCR targets.',
  'Memory leaks and OOM failures in long PyTorch training loops.',
  'Reproducibility issues for ImageNet subset evaluations on ViT models.',
  'Phase I dose-limiting toxicities observed for compound MCF-7-active molecules.',
  'Aqueous solubility failures below 1 μM for oral drug candidates.',
  'Batch size 256 fine-tuning instability on HuggingFace transformers.',
  'Silicon anode fracture under 5C discharge rates.',
  'Why did replication attempts fail for ML drug-screening papers?',
];

interface QueryResponse {
  query_id: string;
  answer: string;
  citations: Array<{
    chunk_id: string;
    tx_hash: string;
    block_explorer_url: string;
    researcher_name: string;
  }>;
  total_cost_usdc: string;
  chunks_retrieved: number;
}

async function registerDemoAgent(): Promise<string> {
  const res = await fetch(`${env.API_BASE_URL}/v1/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: `demo-${Date.now()}` }),
  });
  if (!res.ok) throw new Error(`agents/register failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { apiKey: string };
  return body.apiKey;
}

async function runQuery(apiKey: string, query: string): Promise<QueryResponse> {
  const res = await fetch(`${env.API_BASE_URL}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'Idempotency-Key': randomUUID(),
    },
    body: JSON.stringify({ query, max_chunks: 6, max_price_usdc: 0.25 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`query failed (${res.status}): ${text}`);
  }
  return (await res.json()) as QueryResponse;
}

async function main() {
  logger.info({ url: env.API_BASE_URL }, 'demo-run starting');

  const apiKey = await registerDemoAgent();
  logger.info({ apiKey: `${apiKey.slice(0, 8)}…` }, 'registered demo agent');

  const allTxHashes: string[] = [];
  const perQuery: Array<{ query: string; chunks: number; costUsdc: string }> = [];

  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i]!;
    const t0 = Date.now();
    try {
      const res = await runQuery(apiKey, q);
      for (const c of res.citations) if (c.tx_hash) allTxHashes.push(c.tx_hash);
      perQuery.push({ query: q, chunks: res.chunks_retrieved, costUsdc: res.total_cost_usdc });
      logger.info(
        {
          i: i + 1,
          n: QUERIES.length,
          chunks: res.chunks_retrieved,
          cost: res.total_cost_usdc,
          ms: Date.now() - t0,
        },
        'query complete',
      );
    } catch (err) {
      logger.error({ err, i, query: q }, 'query failed');
    }
  }

  console.log('\n─── DEMO RUN SUMMARY ───');
  console.table(perQuery);
  console.log(`\nTotal on-chain transactions: ${allTxHashes.length}`);
  if (allTxHashes.length < 50) {
    console.warn(`⚠️  Fewer than 50 txs (${allTxHashes.length}). Check retrieval + gemini.`);
  } else {
    console.log('✅ Requirement met: ≥50 on-chain transactions.');
  }
  console.log('\nSample tx hashes:');
  for (const h of allTxHashes.slice(0, 5)) {
    console.log(`  ${h}`);
    console.log(`  → ${env.ARC_EXPLORER_URL}/tx/${h}`);
  }

  await sqlClient.end();
}

main().catch((err) => {
  logger.error({ err }, 'demo-run crashed');
  process.exit(1);
});
