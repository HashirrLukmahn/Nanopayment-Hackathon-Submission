import { describe, expect, test } from 'vitest';
import { assertInvariantHolds, recordRetrievalPayout } from './ledger';

/**
 * Ledger invariant tests.
 *
 * The first test runs on the LEARN #1 stub — it passes because each call
 * writes a balanced trio of rows on the happy path. It does NOT exercise
 * atomicity under failure; that is LEARN #1's target.
 *
 * The second test is skipped. Un-skip it after the stub is replaced with
 * a proper `db.transaction(...)` wrapper — it simulates a mid-transaction
 * failure and asserts that nothing got committed.
 */
describe('ledger', () => {
  test('invariant holds across 500 concurrent writes', async () => {
    const promises = Array.from({ length: 500 }, () =>
      recordRetrievalPayout({ agentId: 'a', researcherId: 'r', priceUsdc: '0.008' }),
    );
    const results = await Promise.all(promises);
    for (const { transactionId } of results) {
      expect(await assertInvariantHolds(transactionId)).toBe(true);
    }
  }, 30_000);

  test.skip('atomicity — failure mid-transaction commits nothing', async () => {
    // TODO: LEARN #1 — un-skip this once recordRetrievalPayout runs inside
    // db.transaction(async (tx) => { ... }).
    //
    // Strategy:
    //  1. Monkey-patch the second insert to throw.
    //  2. Call recordRetrievalPayout and expect it to reject.
    //  3. Query ledger_entries for the generated transactionId.
    //  4. Expect zero rows — because the first insert should have rolled back.
    //
    // If rows are present, atomicity is broken.
    expect(true).toBe(false);
  });
});
