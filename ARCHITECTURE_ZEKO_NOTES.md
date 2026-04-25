# Luqman — Zeko / Dark Knowledge notes (future work)

> **Status:** holding doc for the ZK anti-bias "Dark Knowledge" tier that will
> land in collaboration with Zeko Labs. Not scoped for the current
> hackathon build — see [ARCHITECTURE.md](./ARCHITECTURE.md) for what's
> actually implemented right now.

## Why this tier exists

The Matthew effect in citations: identical content gets cited more often when
attributed to a prestigious institution. If Gemini sees
"author: MIT" vs "author: CU Boulder" in chunk metadata, its ranking will
inherit whatever institutional bias is embedded in its pretraining.

The Dark Knowledge tier attacks this directly by making **Gemini literally
unable to see authorship** at retrieval time. The ZK layer's job is to let
the backend still pay the right person.

## The insight that makes it work

**Zeko (Mina L2) and Arc (Circle) never have to talk to each other directly.**
Zeko holds credential commitments; the Luqman backend watches Zeko state and
maintains a `commitment → wallet_address` index in Postgres; at query time
Gemini sees anonymized chunks (commitment only); at payment time Arc fires.

- Identity truth lives on Zeko.
- Money truth lives on Arc.
- The backend is the translator.
- No bridge, no cross-chain message passing.

## Flow: researcher upload

```mermaid
sequenceDiagram
    participant R as Researcher
    participant Web as Luqman web
    participant ZK as o1js client
    participant Zeko as Zeko rollup
    participant API as Luqman API
    participant DB as Postgres

    R->>Web: connect wallet
    Web->>ZK: build credential proof
    ZK->>Zeko: submit commitment = H(wallet, nonce, cred_root)
    Note over Zeko: proof verified; commitment stored

    loop every N seconds
        API->>Zeko: watcher: read new commitments
        Zeko-->>API: commitment[]
        API->>DB: upsert { commitment, wallet_address }
    end

    R->>Web: POST chunk content (tier=dark)
    Web->>API: /v1/uploads
    API->>DB: insert { chunk, commitment, price, tier='dark' }
```

## Flow: query with Dark Knowledge chunks

The query-time sequence in [ARCHITECTURE.md](./ARCHITECTURE.md) gets two
extra clauses:

- `retrieval.ts` returns `commitment` instead of `researcher_name` for chunks
  where `tier = 'dark'`.
- Before firing the Circle Nanopayment, the handler looks up
  `commitment → wallet_address` from the `commitments` table.

Nothing else in the hot path changes.

## Trust boundaries

| Boundary                          | What's hidden                      | Why                                                      |
| --------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| **Gemini ↔ researcher identity**  | name, institution, affiliation     | Prevents ranking bias (MIT vs CU Boulder)                |
| **Public ↔ Dark Knowledge chunk** | chunk body (encrypted at rest)     | Tier-3 proprietary; decrypted server-side on paid retrieval |
| **Researcher ↔ platform**         | *nothing* — platform KYCs payouts | Threat model targets the model, not platform surveillance |

Making the last row explicit saves scope-creep arguments: we are not building
a privacy network. We are stopping **the model** from picking Columbia twice
as often as CU Boulder.

## Decisions still open for the partner

1. **Zeko watcher cadence** — freshness of the commitment→wallet index. Poll every 10s, push, or on-demand at retrieval time?
2. **Commitment shape** — `H(wallet_addr, nonce, cred_merkle_path)` is a guess. Is there an idiomatic o1js primitive?
3. **Credential Merkle root** — who maintains the accredited-institution allowlist? Existing on-chain registry, or ship our own for the demo?
4. **Revocation** — if an institution's accreditation is revoked, how do already-uploaded chunks get invalidated?
5. **Gas economics** — Mina gas for commitment submission: platform eats it, or researcher pays?
6. **ADK + Scalekit integration touchpoint** — the Scalekit bearer authorizes the agent to access Dark Knowledge tier; the ZK layer enforces anonymity of the source. These two concerns stay cleanly separated.

## Code changes required when this tier lands

| File                                              | Change                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/api/src/db/schema.ts`                       | Add `commitments` table (commitment, wallet_address, zeko_tx_hash)  |
| `apps/api/src/services/zeko-watcher.ts` (new)     | Background poll of Zeko state → Postgres                            |
| `apps/api/src/services/retrieval.ts`              | Return `commitment` instead of `researcher_name` for dark chunks    |
| `apps/api/src/routes/uploads.ts`                  | Accept `commitment` on dark-tier uploads; verify proof server-side  |
| `apps/web/app/upload/page.tsx` (new)              | Wallet-connect + o1js proof builder for Dark Knowledge uploads      |
| `apps/web/components/AgentDemo.tsx`               | Render commitments (not names) for dark-tier citations              |
