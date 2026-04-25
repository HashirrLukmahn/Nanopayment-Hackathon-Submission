"use client";

import { motion } from "framer-motion";
import { formatUsdc, truncateHash } from "@/lib/format";
import type { QueryResponse } from "@/lib/api";

interface Props {
  result: QueryResponse;
}

/**
 * Animated payment receipt shown after every query.
 * Citations slide in one by one so the judge can see each researcher
 * getting paid in sequence. Each tx_hash links to the Arc block explorer.
 */
export function QueryReceipt({ result }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-card overflow-hidden text-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/20">
        <div>
          <span className="text-xs uppercase tracking-widest text-accent">Receipt</span>
          <code className="ml-3 text-xs text-muted-foreground font-mono">
            {result.query_id.slice(0, 8)}…
          </code>
        </div>
        <div className="text-right">
          <div className="font-serif text-xl">{formatUsdc(result.total_cost_usdc)}</div>
          <div className="text-xs text-muted-foreground">
            {result.chunks_retrieved} researcher{result.chunks_retrieved !== 1 ? "s" : ""} paid
          </div>
        </div>
      </div>

      {/* Citation rows — staggered animation */}
      <div className="divide-y divide-border">
        {result.citations.map((c, i) => (
          <motion.div
            key={c.chunk_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.25 }}
            className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition"
          >
            {/* Citation number */}
            <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-medium">
              {c.citation_number}
            </span>

            {/* Paper + researcher */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium truncate">{c.upload_title}</span>
                {c.tier === 'dark' && (
                  <span
                    title={`Identity committed to Zeko Mina L2 · commitment: ${c.commitment}`}
                    className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 cursor-help"
                  >
                    Zeko
                  </span>
                )}
              </div>
              {c.tier === 'dark' ? (
                <div className="text-xs text-muted-foreground font-mono truncate">
                  anonymous · <span className="text-purple-400">{c.commitment?.slice(0, 18)}…</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground truncate">{c.researcher_name}</div>
              )}
            </div>

            {/* Amount paid */}
            <div className="shrink-0 font-mono text-xs tabular-nums text-foreground">
              {formatUsdc(c.researcher_share_usdc, 4)}
            </div>

            {/* Tx hash → explorer link */}
            {c.tx_hash && c.tx_hash !== "pending" ? (
              <a
                href={c.block_explorer_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 font-mono text-xs text-accent hover:underline"
                title={c.tx_hash}
              >
                {truncateHash(c.tx_hash)}
              </a>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">pending…</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
        <span>
          85% researcher · 15% platform · settled on Arc testnet
          {result.citations.some(c => c.tier === 'dark') && (
            <span className="ml-2 text-purple-400">· anonymous identities via Zeko Mina L2</span>
          )}
        </span>
        <span>debited from your wallet</span>
      </div>
    </motion.div>
  );
}
