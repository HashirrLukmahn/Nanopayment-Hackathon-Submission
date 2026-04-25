# Luqman — Hackathon Submission

**Team**: Hashirr Lukmahn
**Category**: Circle Arc / Nanopayments · AI × Payments
**Date**: 2026-04-21

---

## One-liner

A pay-per-query marketplace for unpublished negative research results.
AI agents pay sub-cent nanopayments per citation on Circle Arc; researchers
get paid 85% per retrieval, enforced by a deterministic on-chain split.

## Why this matters

The most expensive knowledge in science is the knowledge no journal will
publish: the failed drug, the collapsed fine-tune, the dead-end cathode.
Traditional payment rails can't settle $0.005 per call or split it 85/15 in
real time, so this knowledge sits on hard drives forever. Circle Nanopayments
on Arc make the economics work for the first time.

## Demo flow (≈90 seconds)

1. Visit `/` — one-click "Run Query" fires a real call against Gemini.
2. Gemini does function-calling to retrieve chunks from the 17-doc corpus.
3. For each citation, one on-chain nanopayment is sent on Circle Arc testnet.
4. Each tx hash is a live link to Arc's block explorer.
5. Visit `/researcher` to see ledger earnings per researcher, by upload, by
   tier — recharts bar chart, sortable table.

## Checklist

- [x] Builds with `pnpm install && pnpm dev`
- [x] Runs without Circle/Gemini keys (mock-mode fallbacks)
- [x] Runs with real keys against Arc testnet
- [x] End-to-end demo: `pnpm --filter api demo:run` (15 queries, ≈75 txs)
- [x] Double-entry ledger with invariant assertion
- [x] Idempotency keys enforced on `/v1/query`
- [x] 85/15 split enforced with basis-point math + decimal.js ROUND_DOWN
- [x] Smart contract: 10 Foundry test cases covering split math, rounding
      crumb, reentrancy, treasury updates
- [x] Block-explorer links on every payment
- [x] Three clearly-scoped `LEARN` stubs with TODO guidance for the builder
- [x] Architecture diagram + 10 systems-design rationale notes in
      [ARCHITECTURE.md](./ARCHITECTURE.md)

## What's original

- **Negative-results-as-a-product**: reframing the "file drawer problem" as a
  priced retrieval marketplace instead of a publishing pipeline.
- **Chunk as the billing unit**: every passage has a price, every citation is
  a transaction — the retrieval granularity matches the economic granularity.
- **Three-tier pricing (Open / Validated / Dark)**: encodes provenance and
  trust directly into the ranking weight and the per-chunk price.

## Circle product feedback

Below are concrete observations from integrating Arc + Nanopayments + Developer-Controlled Wallets. Writing this up in detail per the hackathon's request for Circle product feedback (the $500 incentive).

### What worked

1. **Developer-Controlled Wallets SDK** — creating 8 seeded wallets for the
   demo was a single `createWallet()` call each. Walletsets as a grouping
   abstraction is exactly the right shape for a platform that needs to spin up
   a wallet per entity without exposing private keys.
2. **Arc testnet stability** — across ~500 test transactions during build-out,
   zero failed settlements. Sub-second confirmation made the real-time UI
   visualization trivially feasible.
3. **Nanopayments SDK ergonomics** — `sendPayment({ amount, currency, from, to, reference })` is a clean surface. Having a deterministic `reference` field let us tie on-chain txs back to our retrieval rows with no extra indexing work.

### Sharp edges

1. **Idempotent retries**: the SDK does not currently expose a clean idempotency
   key on `sendPayment`. We work around this at the business layer by
   making the `reference` = `retrieval_id` and checking our own ledger before
   re-sending — but a first-class idempotency-key on the payment RPC would
   remove a class of bugs for anyone building high-volume agent integrations.
2. **Wallet creation is async**: fine in production, but for hackathon seeding
   scripts the 2–5 second per-wallet wait is painful. A batch-create endpoint
   that returns N wallets in one call would materially help onboarding scripts
   and load-test fixtures.
3. **Block-explorer URL in response**: currently we construct the explorer URL
   client-side from the tx hash. Returning it in the payment response
   (`blockExplorerUrl`) would remove a whole class of "did Circle rename the
   explorer domain?" footguns and make wallet receipts more portable.
4. **Fee transparency for sub-cent amounts**: at $0.005 per payment, fee
   disclosure becomes load-bearing for business model design. A
   `feeEstimate(amount)` RPC would let platforms bake fees into quoted prices
   instead of eating them post-hoc.
5. **TypeScript types for webhook payloads**: we didn't wire webhooks this
   round, but scanning the docs: the TS types for `TransactionCompleted` /
   `TransactionFailed` events look under-specified compared to the DX of the
   wallet SDK. Room for tightening.

### What we'd build next

- **Agent-budget guards** at the SDK layer: a first-class `maxSpend` envelope
  a client can declare per session, rather than every developer re-implementing
  the wrapper.
- **Receipt bundling** for retrieval-heavy use cases: a single on-chain proof
  covering N payments would cut per-tx overhead dramatically for LLM
  workloads that emit hundreds of citations per query.

---

## Repository layout

- [README.md](./README.md) — quickstart, tech stack, LEARN callouts
- [ARCHITECTURE.md](./ARCHITECTURE.md) — diagram + 10 systems-design notes
- [apps/api/](./apps/api/) — Fastify backend
- [apps/web/](./apps/web/) — Next.js 14 frontend
- [packages/contracts/](./packages/contracts/) — Foundry + LuqmanAttribution.sol
- [corpus/](./corpus/) — 17 seeded research write-ups

## Contact

lehashbrown07@gmail.com
