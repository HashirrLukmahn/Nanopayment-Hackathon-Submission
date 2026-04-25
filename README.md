# Luqman — the library of failed experiments

Pay-per-query knowledge marketplace for unpublished negative research results.
AI agents pay a few cents per citation. Researchers finally get paid for the
experiments that didn't work — the file-drawer knowledge that journals reject
but that actually advances science.

Built for the hackathon on **Circle Arc testnet** with **Nanopayments**,
**Gemini 2.5 Flash Function Calling**, Fastify + Drizzle + Postgres, Next.js
14 App Router, and Foundry-tested Solidity.

## Quickstart

```bash
# 0. prereqs: node 20+, pnpm 9+, docker, foundry
pnpm install

# 1. bring up Postgres
docker compose up -d

# 2. copy env and fill in Circle + Gemini keys (optional — runs in mock mode without them)
cp .env.example .env

# 3. migrate + seed researchers + seed corpus
pnpm --filter api db:push
pnpm --filter api seed:researchers
pnpm --filter api seed:corpus

# 4. run API + web
pnpm dev
```

API: [http://localhost:3001](http://localhost:3001) · Web: [http://localhost:3000](http://localhost:3000)

## What's where

| Path                                | What lives there                                                     |
| ----------------------------------- | -------------------------------------------------------------------- |
| `apps/api/`                         | Fastify backend — routes, services, Drizzle schema, seed scripts     |
| `apps/web/`                         | Next.js 14 frontend — landing, demo, researcher + admin pages        |
| `packages/contracts/`               | Foundry project — LuqmanAttribution.sol + 10 test cases              |
| `corpus/`                           | 17 markdown research write-ups across chemistry, ML, materials       |
| `ARCHITECTURE.md`                   | Full system diagram + 10 systems-design rationale notes              |

## Three `LEARN` stubs

Three sections are intentionally left as stubs for hand-implementation. Each is
clearly commented with a TODO block and has runnable scaffolding around it:

1. **`apps/api/src/services/ledger.ts`** — wrap the three-row double-entry write
   in a `db.transaction()` and add an invariant-holds assertion at commit.
2. **`apps/api/src/middleware/idempotency.ts`** — look up the
   `Idempotency-Key`, compare request-body hashes, and return the cached
   response verbatim on replay.
3. **`packages/contracts/src/LuqmanAttribution.sol`** — implement
   `registerResearcher` and `recordRetrievalBatch`. 10 Foundry tests are
   already written; make them pass.

The `/admin` page in the web app has a friendly UI for these three tasks.

## The money path

```
Agent  ── HTTPS /v1/query ──▶ API ── Gemini function-calling loop ──▶ chunks
                                │
                                ▼ for each chunk:
                              split price 85/15 (decimal.js ROUND_DOWN)
                                │
                              ledger: debit agent_account → credit researcher → credit platform
                                │
                              Circle Nanopayment (or mock) ── txHash ─▶ block explorer link
                                │
                              update retrieval row with tx_hash
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full diagram and
the ten systems-design decisions (money-as-strings, idempotency at the
business layer, chunk as the billing unit, etc.).

## Demo script (≈90s)

```bash
pnpm --filter api demo:run
```

Runs 15 canned queries back-to-back, produces ≈75 on-chain payments, and
prints an "everything balances" ledger-invariant check at the end.

## Tech stack

- **Backend**: Fastify 4 · Drizzle ORM · Postgres 16 · zod · pino · decimal.js
- **Payments**: Circle Developer-Controlled Wallets · Circle Nanopayments · Arc testnet
- **AI**: Gemini 2.5 Flash with function calling (`@google/genai`)
- **Frontend**: Next.js 14 (App Router) · Tailwind · shadcn-style components · framer-motion · recharts
- **Contracts**: Solidity 0.8.24 · Foundry · OpenZeppelin (Ownable, ReentrancyGuard)
- **Monorepo**: pnpm workspaces + turbo

## License

MIT
