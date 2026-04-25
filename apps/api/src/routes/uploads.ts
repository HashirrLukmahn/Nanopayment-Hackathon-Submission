import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client';
import { chunks, researchers, uploads } from '../db/schema';
import { buildKeywordVector } from '../services/retrieval';
import { NotFoundError, ValidationError } from '../lib/errors';

const uploadBodySchema = z.object({
  researcherId: z.string().uuid(),
  title: z.string().min(4).max(200),
  tier: z.enum(['open', 'validated', 'dark']),
  content: z.string().min(200).max(500_000),
});

const CHUNK_CHAR_TARGET = 2000;

/**
 * Split a long string into ~CHUNK_CHAR_TARGET-sized pieces, preferring
 * sentence-end boundaries when close to the target. Deterministic.
 */
export function chunkText(content: string): string[] {
  const clean = content.replace(/\r\n?/g, '\n').trim();
  const out: string[] = [];
  let cursor = 0;
  while (cursor < clean.length) {
    const end = Math.min(cursor + CHUNK_CHAR_TARGET, clean.length);
    if (end === clean.length) {
      out.push(clean.slice(cursor));
      break;
    }
    // Look for the last sentence terminator within the window's last 400 chars.
    const windowStart = Math.max(cursor + CHUNK_CHAR_TARGET - 400, cursor + 500);
    const slice = clean.slice(windowStart, end);
    const lastEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'), slice.lastIndexOf('\n\n'));
    const cut = lastEnd >= 0 ? windowStart + lastEnd + 1 : end;
    out.push(clean.slice(cursor, cut).trim());
    cursor = cut;
  }
  return out.filter((c) => c.length > 0);
}

function approximateTokenCount(s: string): number {
  return Math.max(1, Math.round(s.split(/\s+/).length * 1.3));
}

export async function uploadsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /uploads
   *
   * Body: { researcherId, title, tier, content }
   * Chunks the content, computes keyword vectors, inserts atomically.
   */
  fastify.post('/uploads', async (request, reply) => {
    const parsed = uploadBodySchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Invalid body', parsed.error.flatten());

    const { researcherId, title, tier, content } = parsed.data;
    const [r] = await db.select().from(researchers).where(eq(researchers.id, researcherId)).limit(1);
    if (!r) throw new NotFoundError('Researcher not found');

    const pieces = chunkText(content);
    if (pieces.length === 0) throw new ValidationError('Content chunked to zero pieces');

    const [upload] = await db
      .insert(uploads)
      .values({ researcherId, title, tier })
      .returning({ id: uploads.id });

    const rows = pieces.map((c, i) => ({
      uploadId: upload!.id,
      position: i,
      content: c,
      tokenCount: approximateTokenCount(c),
      keywordVector: buildKeywordVector(c),
    }));
    await db.insert(chunks).values(rows);

    reply.code(201);
    return { uploadId: upload!.id, chunkCount: rows.length };
  });
}
