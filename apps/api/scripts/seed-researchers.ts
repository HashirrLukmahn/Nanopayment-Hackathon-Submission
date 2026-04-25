import { db } from '../src/db/client';
import { researchers } from '../src/db/schema';
import { createResearcherWallet } from '../src/services/circle-wallets';
import { logger } from '../src/logger';
import { sql as sqlClient } from '../src/db/client';

/**
 * Seeds 8 simulated researchers with Circle wallets (or deterministic fake
 * addresses when CIRCLE_API_KEY is missing). Idempotent: skips existing names.
 */
const NAMES = [
  'Dr. Asma Khan',
  'Dr. Ben Park',
  'Dr. Camila Rivera',
  'Dr. Dmitri Orlov',
  'Dr. Eva Ostrowski',
  'Dr. Farouk Mansour',
  'Dr. Grace Lim',
  'Dr. Hiro Tanaka',
];

async function main() {
  const existing = await db.select({ displayName: researchers.displayName }).from(researchers);
  const existingSet = new Set(existing.map((r) => r.displayName));

  let created = 0;
  for (const name of NAMES) {
    if (existingSet.has(name)) {
      logger.info({ name }, 'researcher already exists, skipping');
      continue;
    }
    const wallet = await createResearcherWallet(name);
    await db.insert(researchers).values({
      displayName: name,
      walletAddress: wallet.address,
      walletId: wallet.walletId,
    });
    created++;
    logger.info(
      { name, address: wallet.address, walletId: wallet.walletId, mocked: wallet.mocked },
      'seeded researcher',
    );
  }

  const total = await db.select({ id: researchers.id }).from(researchers);
  logger.info({ created, total: total.length }, 'seed-researchers complete');
  await sqlClient.end();
}

main().catch((err) => {
  logger.error({ err }, 'seed-researchers failed');
  process.exit(1);
});
