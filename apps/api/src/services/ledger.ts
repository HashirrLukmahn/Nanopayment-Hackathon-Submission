import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { db } from '../db/client';
import { ledgerEntries } from '../db/schema';
import { priceForChunk, splitPrice } from './attribution';
import { toUsdc } from '../lib/money';

/**
 * Double-entry ledger. LEARN #1 for Hashirr.
 *
 * The ledger is the source of truth for who owes whom, independent of chain
 * settlement. Every retrieval produces three rows — a debit from the agent
 * and credits to the researcher and the platform — all sharing one
 * `transaction_id` so the double-entry invariant (debits - credits = 0) can
 * be checked per transaction.
 *
 * REQUIREMENTS (see CLAUDE_CODE_SPEC.md):
 *  1. All entries for one retrieval share the same transactionId
 *  2. Sum of debits = sum of credits
 *  3. All writes in ONE Postgres transaction (db.transaction())
 *  4. Numeric strings only — never JS number for money
 *  5. assertInvariantHolds(txId) returns true iff debits - credits = 0
 */

export type LedgerEntryInput = {
  transactionId: string;
  accountId: string;
  direction: 'debit' | 'credit';
  amountUsdc: string;
};

/**
 * Records a completed chunk retrieval as a three-way split. See module JSDoc
 * for requirements.
 *
 * TODO: LEARN #1 — Hashirr to implement correctly. The current body is an
 * UNSAFE STUB that does NOT satisfy requirement #3 (atomicity) and emits a
 * console.warn every call. Replace the three sequential inserts below with
 * `db.transaction(async (tx) => { ... })`. Until then, a crash between the
 * first and third insert will leave the ledger unbalanced.
 */
export async function recordRetrievalPayout(args: {
  agentId: string;
  researcherId: string;
  priceUsdc: string;
}): Promise<{ transactionId: string }> {
  console.warn('[LEARN #1] ledger stub active — writes are NOT atomic');

  const transactionId = randomUUID();
  const price = args.priceUsdc ?? priceForChunk();
  const split = splitPrice(price);

  const rows: LedgerEntryInput[] = [
    {
      transactionId,
      accountId: `agent:${args.agentId}`,
      direction: 'debit',
      amountUsdc: split.priceUsdc,
    },
    {
      transactionId,
      accountId: `researcher:${args.researcherId}`,
      direction: 'credit',
      amountUsdc: split.researcherShareUsdc,
    },
    {
      transactionId,
      accountId: 'platform',
      direction: 'credit',
      amountUsdc: split.platformShareUsdc,
    },
  ];

  for (const row of rows) {
    await db.insert(ledgerEntries).values({
      transactionId: row.transactionId,
      accountId: row.accountId,
      direction: row.direction,
      amountUsdc: row.amountUsdc,
    });
  }

  return { transactionId };
}

/**
 * Returns true iff `sum(debits) - sum(credits) = 0` for the given
 * transactionId. Implemented fully so the test suite can run against the
 * stub above.
 */
export async function assertInvariantHolds(transactionId: string): Promise<boolean> {
  const rows = await db.execute<{ balance: string | null }>(sql`
    SELECT COALESCE(
      SUM(CASE WHEN direction = 'debit' THEN amount_usdc ELSE -amount_usdc END),
      0
    )::text AS balance
    FROM ledger_entries
    WHERE transaction_id = ${transactionId}
  `);

  const first = rows[0];
  if (!first) return false;
  const balance = new Decimal(first.balance ?? '0');
  return balance.eq(0);
}

/**
 * Sum of credits on a given account. Used by the earnings endpoint.
 * Returns a canonical 6-decimal USDC string.
 */
export async function sumCreditsForAccount(accountId: string): Promise<string> {
  const rows = await db.execute<{ total: string | null }>(sql`
    SELECT COALESCE(SUM(amount_usdc), 0)::text AS total
    FROM ledger_entries
    WHERE account_id = ${accountId} AND direction = 'credit'
  `);
  const first = rows[0];
  return toUsdc(first?.total ?? '0');
}
