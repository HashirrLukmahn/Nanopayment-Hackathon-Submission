"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyWallet, requestFaucetFunds, type WalletInfo } from "@/lib/api";
import { formatUsdc } from "@/lib/format";

/**
 * WalletCard — shows the logged-in user's Circle wallet balance, on-chain
 * address, and a "Get testnet USDC" button for the hackathon demo.
 *
 * Polls balance every 10 seconds so payouts from researcher citations
 * appear without a page refresh.
 */
export function WalletCard() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    const data = await getMyWallet();
    setWallet(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchWallet();
    const interval = setInterval(fetchWallet, 10_000);
    return () => clearInterval(interval);
  }, [fetchWallet]);

  async function handleFaucet() {
    setFunding(true);
    try {
      const result = await requestFaucetFunds();
      setLastTx(result.txHash);
      // Refresh balance after 2s (give Arc time to settle)
      setTimeout(fetchWallet, 2000);
    } catch (err) {
      console.error("faucet error:", err);
    } finally {
      setFunding(false);
    }
  }

  function handleCopy() {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-24 rounded bg-muted mb-3" />
        <div className="h-8 w-32 rounded bg-muted" />
      </div>
    );
  }

  if (!wallet) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-accent">Your wallet</div>
          <div className="mt-1 text-xs text-muted-foreground font-mono">
            Circle Developer-Controlled · Arc testnet
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-3xl tracking-tight">
            {formatUsdc(wallet.balanceUsdc)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">USDC balance</div>
        </div>
      </div>

      {/* Address row */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <span className="text-xs text-muted-foreground shrink-0">Address</span>
        <code className="flex-1 truncate font-mono text-xs text-foreground">
          {wallet.address ?? "—"}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        {wallet.explorerUrl && (
          <a
            href={wallet.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs text-accent hover:underline"
          >
            Explorer ↗
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-6 py-4">
        <button
          onClick={handleFaucet}
          disabled={funding}
          className="rounded-md border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted transition disabled:opacity-50"
        >
          {funding ? "Requesting…" : "+ Get $1 testnet USDC"}
        </button>

        {lastTx && (
          <span className="text-xs text-muted-foreground">
            Funded ·{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${lastTx}`}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline font-mono"
            >
              {lastTx.slice(0, 10)}…
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
