# @luqman/contracts

Foundry project for `LuqmanAttribution.sol` — the 85/15 splitter that records chunk retrievals on-chain.

## Setup

```bash
pnpm --filter @luqman/contracts install:deps   # installs forge-std + OpenZeppelin
forge build
```

## Run tests

```bash
forge test -vv
# with gas report:
forge test -vv --gas-report
```

All tests fail until `LuqmanAttribution.sol` is implemented — **this is by design**. The contract body is [LEARN #3 in the spec](../../Luqman_Claude_Code_Spec.md). Fill in `registerResearcher` and `recordRetrieval` until every test in `test/LuqmanAttribution.t.sol` passes.

## Deploy

```bash
export PRIVATE_KEY=0x...
export LUQMAN_TREASURY_ADDRESS=0x...
export ARC_RPC_URL=https://testnet-rpc.arc.network
forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast --private-key $PRIVATE_KEY -vvvv
```

Copy the deployed address into `.env` as `LUQMAN_ATTRIBUTION_ADDRESS`.

## Design

- USDC is treated as the native gas token on Arc; `msg.value` IS the USDC amount.
- Checks-Effects-Interactions + `ReentrancyGuard` on `recordRetrieval`.
- The platform receives the rounding crumb when splits don't divide evenly (researcher share rounds down).
- One `RetrievalRecorded` event per retrieval; the frontend indexes these for the live payment stream.
