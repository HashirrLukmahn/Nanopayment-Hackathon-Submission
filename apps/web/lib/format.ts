/**
 * USDC & tx formatting helpers. Never use `Number()` on USDC amounts — we treat
 * them as strings throughout.
 */

export function formatUsdc(amount: string | number, decimals = 6): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return "$0.000000";
  return `$${n.toFixed(decimals)}`;
}

export function formatUsdcCompact(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return "$0";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function truncateHash(hash: string, start = 6, end = 4): string {
  if (!hash) return "";
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

export function truncateAddress(addr: string): string {
  return truncateHash(addr, 6, 4);
}

export function formatTimestamp(ts: number | string | Date): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
