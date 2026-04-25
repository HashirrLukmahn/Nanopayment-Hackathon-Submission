import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { db, sql as sqlClient } from '../src/db/client';
import { chunks, researchers, uploads } from '../src/db/schema';
import { buildKeywordVector } from '../src/services/retrieval';
import { logger } from '../src/logger';
import { asc } from 'drizzle-orm';

/**
 * Reads /corpus/*.md, parses minimal frontmatter, chunks each paper at ~2000
 * chars (prefers sentence boundaries), computes keyword vectors, and inserts
 * uploads + chunks with round-robin researcher assignment.
 */

const CORPUS_DIR = resolve(process.cwd(), '../../corpus');
const CHUNK_CHAR_TARGET = 2000;

interface Frontmatter {
  title: string;
  tier: 'open' | 'validated' | 'dark';
  researcherHint?: string;
  domain?: string;
}

function parseFrontmatter(src: string): { fm: Frontmatter; body: string } {
  const match = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { fm: { title: 'Untitled', tier: 'validated' }, body: src };
  }
  const [, header, body] = match;
  const fm: Partial<Frontmatter> = {};
  for (const line of header!.split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const rawValue = line.slice(i + 1).trim();
    const value = rawValue.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    if (key === 'title') fm.title = value;
    else if (key === 'tier') fm.tier = value as Frontmatter['tier'];
    else if (key === 'researcher_hint' && value && value !== 'null') fm.researcherHint = value;
    else if (key === 'domain') fm.domain = value;
  }
  return {
    fm: {
      title: fm.title ?? 'Untitled',
      tier: fm.tier ?? 'validated',
      researcherHint: fm.researcherHint,
      domain: fm.domain,
    },
    body: body ?? '',
  };
}

function chunkText(content: string): string[] {
  const clean = content.replace(/\r\n?/g, '\n').trim();
  const out: string[] = [];
  let cursor = 0;
  while (cursor < clean.length) {
    const end = Math.min(cursor + CHUNK_CHAR_TARGET, clean.length);
    if (end === clean.length) {
      out.push(clean.slice(cursor));
      break;
    }
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

async function main() {
  const rows = await db
    .select({ id: researchers.id, displayName: researchers.displayName })
    .from(researchers)
    .orderBy(asc(researchers.displayName));
  if (rows.length === 0) {
    throw new Error('No researchers found. Run `pnpm seed:researchers` first.');
  }

  const files = (await readdir(CORPUS_DIR)).filter((f) => f.endsWith('.md')).sort();
  if (files.length === 0) {
    throw new Error(`No markdown files in ${CORPUS_DIR}`);
  }

  let totalUploads = 0;
  let totalChunks = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const src = await readFile(join(CORPUS_DIR, file), 'utf8');
    const { fm, body } = parseFrontmatter(src);

    let researcherId = rows[i % rows.length]!.id;
    if (fm.researcherHint) {
      const match = rows.find((r) => r.displayName === fm.researcherHint);
      if (match) researcherId = match.id;
    }

    const pieces = chunkText(body);
    const [upload] = await db
      .insert(uploads)
      .values({
        researcherId,
        title: fm.title,
        tier: fm.tier,
        sourcePath: file,
      })
      .returning({ id: uploads.id });

    await db.insert(chunks).values(
      pieces.map((c, pos) => ({
        uploadId: upload!.id,
        position: pos,
        content: c,
        tokenCount: approximateTokenCount(c),
        keywordVector: buildKeywordVector(c),
      })),
    );

    totalUploads++;
    totalChunks += pieces.length;
    logger.info({ file, title: fm.title, chunks: pieces.length }, 'seeded upload');
  }

  logger.info(
    { uploads: totalUploads, chunks: totalChunks, researchers: rows.length },
    'seed-corpus complete',
  );
  await sqlClient.end();
}

main().catch((err) => {
  logger.error({ err }, 'seed-corpus failed');
  process.exit(1);
});
