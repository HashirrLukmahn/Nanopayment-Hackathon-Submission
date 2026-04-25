import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { db } from '../src/db/client';
import { researchers, uploads, chunks } from '../src/db/schema';
import { buildKeywordVector } from '../src/services/retrieval';
import { logger } from '../src/logger';
import { eq } from 'drizzle-orm';
import { sql } from '../src/db/client';

const RESEARCHER_ID = '75d25334-b89b-4fee-aa9a-4d22781bdc57';
const CORPUS_FILE = resolve(process.cwd(), '../../corpus/neuro-01.md');
const CHUNK_CHAR_TARGET = 2000;

function chunkText(content: string): string[] {
  const clean = content.replace(/\r\n?/g, '\n').trim();
  const out: string[] = [];
  let cursor = 0;
  while (cursor < clean.length) {
    const end = Math.min(cursor + CHUNK_CHAR_TARGET, clean.length);
    if (end === clean.length) { out.push(clean.slice(cursor)); break; }
    const windowStart = Math.max(cursor + CHUNK_CHAR_TARGET - 400, cursor + 500);
    const slice = clean.slice(windowStart, end);
    const lastEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'), slice.lastIndexOf('\n\n'));
    const cut = lastEnd >= 0 ? windowStart + lastEnd + 1 : end;
    out.push(clean.slice(cursor, cut).trim());
    cursor = cut;
  }
  return out.filter((c) => c.length > 0);
}

async function main() {
  const [r] = await db.select().from(researchers).where(eq(researchers.id, RESEARCHER_ID)).limit(1);
  if (!r) { logger.error('Researcher not found'); process.exit(1); }

  const src = await readFile(CORPUS_FILE, 'utf8');
  const bodyMatch = src.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  const body = bodyMatch?.[1] ?? src;
  const titleMatch = src.match(/title:\s*["']?(.+?)["']?\n/);
  const title = titleMatch?.[1] ?? 'Untitled';

  const existing = await db.select({ id: uploads.id }).from(uploads)
    .where(eq(uploads.title, title)).limit(1);
  if (existing[0]) {
    logger.info({ title }, 'upload already exists, skipping');
    await sql.end();
    return;
  }

  const pieces = chunkText(body);
  const [upload] = await db.insert(uploads).values({
    researcherId: RESEARCHER_ID,
    title,
    tier: 'validated',
  }).returning({ id: uploads.id });

  const rows = pieces.map((c, i) => ({
    uploadId: upload!.id,
    position: i,
    content: c,
    tokenCount: Math.max(1, Math.round(c.split(/\s+/).length * 1.3)),
    keywordVector: buildKeywordVector(c),
  }));
  await db.insert(chunks).values(rows);

  logger.info({ title, chunks: rows.length, researcherId: RESEARCHER_ID }, 'seeded paper for Hashirr Lukmahn');
  await sql.end();
}

main().catch((err) => { logger.error({ err }, 'seed failed'); process.exit(1); });
