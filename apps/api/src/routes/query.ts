import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';
import { db } from '../db/client';
import { queries, researchers, retrievals } from '../db/schema';
import { runAgenticQuery } from '../services/gemini';
import { priceForChunk, splitPrice } from '../services/attribution';
import { recordRetrievalPayout } from '../services/ledger';
import { sendNanopayment } from '../services/nanopayments';
import { logger } from '../logger';
import { toUsdc, ZERO_USDC } from '../lib/money';
import { UnauthorizedError, ValidationError } from '../lib/errors';

const queryBodySchema = z.object({
  query: z.string().min(3).max(2000),
  max_chunks: z.number().int().min(1).max(50).default(20),
  max_price_usdc: z.coerce.number().positive().max(1).default(0.25),
});

export async function queryRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /query — the heart of the service.
   *
   * Flow:
   *  1. Validate body, read Idempotency-Key (enforced by idempotency plugin).
   *  2. Insert a placeholder row in queries with totalCost=0.
   *  3. Run the Gemini agent loop → returns answer + chunksUsed[].
   *  4. For each unique chunk cited:
   *     a. Compute price + split.
   *     b. Insert retrievals row (txHash null).
   *     c. Call ledger.recordRetrievalPayout (LEARN #1 stub today).
   *     d. Call nanopayments.sendNanopayment.
   *     e. Update retrievals row with txHash.
   *  5. Update queries.totalCostUsdc.
   *  6. Respond.
   */
  fastify.post('/query', async (request) => {
    if (!request.agent) throw new UnauthorizedError();
    const parsed = queryBodySchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Invalid body', parsed.error.flatten());

    const { query, max_chunks, max_price_usdc } = parsed.data;
    const idempotencyKey = request.headers['idempotency-key'] as string;

    const unitPrice = priceForChunk();
    const estimatedMax = new Decimal(unitPrice).mul(max_chunks);
    if (estimatedMax.gt(max_price_usdc)) {
      throw new ValidationError(
        `Estimated max cost $${estimatedMax.toFixed(6)} exceeds max_price_usdc $${max_price_usdc}`,
      );
    }

    // (1) + (2) Insert placeholder query row.
    const [queryRow] = await db
      .insert(queries)
      .values({
        agentId: request.agent.id,
        queryText: query,
        idempotencyKey,
        totalCostUsdc: ZERO_USDC,
      })
      .returning({ id: queries.id });

    const queryId = queryRow!.id;

    // (3) Gemini loop.
    const agentResult = await runAgenticQuery({ queryText: query, maxChunks: max_chunks });
    if (agentResult.chunksUsed.length === 0) {
      return {
        query_id: queryId,
        answer: agentResult.answer,
        citations: [],
        total_cost_usdc: '0.000000',
        chunks_retrieved: 0,
      };
    }

    // Dedupe chunks by chunkId (Gemini can cite the same chunk under multiple numbers).
    const uniqueChunks = Array.from(
      new Map(agentResult.chunksUsed.map((c) => [c.chunkId, c])).values(),
    );

    const citations: Array<{
      chunk_id: string;
      citation_number: number;
      researcher_name: string;   // '[anonymous]' for dark tier
      researcher_id: string;
      upload_title: string;
      snippet: string;
      tier: string;
      commitment: string | null; // Zeko commitment hash — set for dark tier
      price_usdc: string;
      researcher_share_usdc: string;
      platform_share_usdc: string;
      tx_hash: string;
      block_explorer_url: string;
    }> = [];

    let runningTotal = new Decimal(0);

    for (const c of uniqueChunks) {
      const split = splitPrice(unitPrice);

      // (4a) Insert retrieval row.
      const [retrieval] = await db
        .insert(retrievals)
        .values({
          queryId,
          chunkId: c.chunkId,
          priceUsdc: split.priceUsdc,
          researcherShare: split.researcherShareUsdc,
          platformShare: split.platformShareUsdc,
        })
        .returning({ id: retrievals.id });

      // (4b) Ledger entry.
      try {
        await recordRetrievalPayout({
          agentId: request.agent.id,
          researcherId: c.researcherId,
          priceUsdc: split.priceUsdc,
        });
      } catch (err) {
        logger.error({ err, chunkId: c.chunkId }, 'ledger.recordRetrievalPayout failed');
        // Continue — for the demo we still want to attempt settlement.
      }

      // (4c) Find researcher wallet address for the payment target.
      const [researcher] = await db
        .select({ address: researchers.walletAddress })
        .from(researchers)
        .where(eq(researchers.id, c.researcherId))
        .limit(1);

      // (4d) Broadcast nanopayment.
      let txHash = 'pending';
      let blockExplorerUrl = '';
      try {
        const paymentRes = await sendNanopayment({
          fromWalletId: request.agent.faucetWalletId ?? 'mock-faucet',
          toAddress: researcher?.address ?? '0x0',
          amountUsdc: split.researcherShareUsdc,
          referenceId: retrieval!.id,
        });
        txHash = paymentRes.txHash;
        blockExplorerUrl = paymentRes.blockExplorerUrl;
      } catch (err) {
        logger.error({ err, retrievalId: retrieval!.id }, 'sendNanopayment failed');
      }

      // (4e) Persist tx hash.
      if (txHash && txHash !== 'pending') {
        await db
          .update(retrievals)
          .set({ txHash })
          .where(eq(retrievals.id, retrieval!.id));
      }

      runningTotal = runningTotal.plus(split.priceUsdc);

      citations.push({
        chunk_id: c.chunkId,
        citation_number: c.citationNumber,
        // Dark tier: surface '[anonymous]' to the caller — identity is on Zeko.
        // Payment still routes to the real wallet via the backend's commitment map.
        researcher_name: c.tier === 'dark' ? '[anonymous]' : c.researcherName,
        researcher_id: c.researcherId,
        upload_title: c.uploadTitle,
        snippet: c.snippet,
        tier: c.tier,
        commitment: c.commitment,
        price_usdc: split.priceUsdc,
        researcher_share_usdc: split.researcherShareUsdc,
        platform_share_usdc: split.platformShareUsdc,
        tx_hash: txHash,
        block_explorer_url: blockExplorerUrl,
      });
    }

    // (5) Update query totalCost.
    const totalUsdc = toUsdc(runningTotal);
    await db.update(queries).set({ totalCostUsdc: totalUsdc }).where(eq(queries.id, queryId));

    // (6) Respond.
    return {
      query_id: queryId,
      answer: agentResult.answer,
      citations,
      total_cost_usdc: totalUsdc,
      chunks_retrieved: citations.length,
    };
  });
}
