"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BlockExplorerLink } from "./BlockExplorerLink";
import { formatUsdc } from "@/lib/format";
import type { QueryCitation } from "@/lib/api";

/**
 * The money flow visualization — the single most important UI in the app.
 *
 * Citations arrive in order. Each renders as a row that slides in from the top
 * with a subtle glow on the "$X.XX → researcher" line. This is the "you can
 * actually see the money move" moment judges are supposed to remember.
 */
export function PaymentStream({ citations }: { citations: QueryCitation[] }) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {citations.map((c) => (
          <motion.div
            key={c.chunk_id}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-md border border-border bg-card/60 p-4 hover:border-accent/40 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    [{c.citation_number}]
                  </span>
                  <span className="font-serif text-base text-foreground truncate">
                    {c.upload_title}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  by {c.researcher_name}
                </div>
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed line-clamp-2">
                  {c.snippet}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-sm text-accent tabular-nums">
                  {formatUsdc(c.price_usdc)}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {formatUsdc(c.researcher_share_usdc)} → researcher
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {formatUsdc(c.platform_share_usdc)} → platform
                </div>
                <div className="mt-2">
                  <BlockExplorerLink
                    txHash={c.tx_hash}
                    explorerUrl={c.block_explorer_url}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
