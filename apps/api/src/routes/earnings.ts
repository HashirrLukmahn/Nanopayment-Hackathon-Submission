import type { FastifyInstance } from 'fastify';
import { desc, eq, sql as sqlTag } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client';
import { researchers } from '../db/schema';
import { sumCreditsForAccount } from '../services/ledger';
import { NotFoundError } from '../lib/errors';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function earningsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /earnings/:id
   *
   * Returns total credits to the researcher's ledger account plus per-upload
   * earnings and retrieval counts. Ledger is the source of truth; retrievals
   * gives the breakdown.
   */
  fastify.get('/earnings/:id', async (request) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) throw new NotFoundError('Researcher not found');
    const { id } = parsed.data;

    const [researcher] = await db
      .select()
      .from(researchers)
      .where(eq(researchers.id, id))
      .limit(1);
    if (!researcher) throw new NotFoundError('Researcher not found');

    const totalEarnings = await sumCreditsForAccount(`researcher:${id}`);

    // uploads → chunks → retrievals is a 3-hop join; cleaner as raw SQL.
    const uploadBreakdown = await db.execute<{
      upload_id: string;
      title: string;
      tier: string;
      earnings: string;
      retrieval_count: number;
    }>(sqlTag`
      SELECT
        u.id AS upload_id,
        u.title,
        u.tier,
        COALESCE(SUM(r.researcher_share), 0)::text AS earnings,
        COUNT(r.id)::int AS retrieval_count
      FROM uploads u
      LEFT JOIN chunks c ON c.upload_id = u.id
      LEFT JOIN retrievals r ON r.chunk_id = c.id
      WHERE u.researcher_id = ${id}
      GROUP BY u.id, u.title, u.tier
      ORDER BY earnings DESC
    `);

    return {
      researcherId: researcher.id,
      displayName: researcher.displayName,
      walletAddress: researcher.walletAddress,
      totalEarningsUsdc: totalEarnings,
      uploads: uploadBreakdown.map((r) => ({
        uploadId: r.upload_id,
        title: r.title,
        tier: r.tier,
        earningsUsdc: r.earnings,
        retrievalCount: Number(r.retrieval_count),
      })),
    };
  });

  /**
   * GET /researchers — list all for the dashboard selector.
   */
  fastify.get('/researchers', async () => {
    const rows = await db
      .select({
        id: researchers.id,
        displayName: researchers.displayName,
        walletAddress: researchers.walletAddress,
      })
      .from(researchers)
      .orderBy(desc(researchers.createdAt));
    return { researchers: rows };
  });
}
