import { v4 as uuidv4 } from "uuid";

/**
 * Typed fetch wrappers for the BFF → Fastify backend proxy.
 * Client code should call these; server route.ts files are the thin transport.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface QueryCitation {
  chunk_id: string;
  citation_number: number;
  researcher_name: string;      // '[anonymous]' for dark tier
  researcher_id: string;
  upload_title: string;
  snippet: string;
  tier: string;
  commitment: string | null;    // Zeko commitment hash for dark tier
  price_usdc: string;
  researcher_share_usdc: string;
  platform_share_usdc: string;
  tx_hash: string;
  block_explorer_url: string;
}

export interface QueryResponse {
  query_id: string;
  answer: string;
  citations: QueryCitation[];
  total_cost_usdc: string;
  chunks_retrieved: number;
}

export async function runQuery(args: {
  query: string;
  maxChunks?: number;
  maxPriceUsdc?: number;
  apiKey: string;
}): Promise<QueryResponse> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": args.apiKey,
      "Idempotency-Key": uuidv4(),
    },
    body: JSON.stringify({
      query: args.query,
      max_chunks: args.maxChunks ?? 20,
      max_price_usdc: args.maxPriceUsdc ?? 0.25,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`query failed (${res.status}): ${err}`);
  }
  return (await res.json()) as QueryResponse;
}

export interface Researcher {
  id: string;
  displayName: string;
  walletAddress: string;
}

export async function listResearchers(): Promise<{ researchers: Researcher[] }> {
  const res = await fetch("/api/researchers");
  if (!res.ok) return { researchers: [] };
  return (await res.json()) as { researchers: Researcher[] };
}

export interface EarningsResponse {
  researcherId: string;
  displayName: string;
  walletAddress: string;
  totalEarningsUsdc: string;
  uploads: Array<{
    uploadId: string;
    title: string;
    tier: "open" | "validated" | "dark";
    earningsUsdc: string;
    retrievalCount: number;
  }>;
}

export async function getEarnings(id: string): Promise<EarningsResponse | null> {
  const res = await fetch(`/api/earnings/${id}`);
  if (!res.ok) return null;
  return (await res.json()) as EarningsResponse;
}

export async function registerAgent(agentId: string): Promise<{ apiKey: string; agentId: string }> {
  const res = await fetch("/api/agents-register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  });
  if (!res.ok) throw new Error(`register agent failed: ${res.status}`);
  return (await res.json()) as { apiKey: string; agentId: string };
}

// ── Wallet ─────────────────────────────────────────────────────────────────

export interface WalletInfo {
  provisioned: boolean;
  walletId?: string;
  address: string | null;
  balanceUsdc: string;
  explorerUrl: string | null;
}

export async function getMyWallet(): Promise<WalletInfo | null> {
  const res = await fetch('/api/wallets/me', { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as WalletInfo;
}

export interface FaucetResult {
  ok: boolean;
  amount: string;
  toAddress: string;
  txHash: string;
  mocked: boolean;
}

export async function requestFaucetFunds(): Promise<FaucetResult> {
  const res = await fetch('/api/wallets/faucet', { method: 'POST' });
  if (!res.ok) throw new Error(`faucet failed: ${res.status}`);
  return (await res.json()) as FaucetResult;
}

export { API_BASE };
