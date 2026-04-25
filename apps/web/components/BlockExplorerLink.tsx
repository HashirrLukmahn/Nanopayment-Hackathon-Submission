import { truncateHash } from "@/lib/format";

export function BlockExplorerLink({
  txHash,
  explorerUrl,
  className,
}: {
  txHash: string;
  explorerUrl?: string;
  className?: string;
}) {
  const href = explorerUrl || `https://arc-sepolia.explorer.circle.com/tx/${txHash}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        "font-mono text-xs text-accent/90 hover:text-accent underline-offset-4 hover:underline transition " +
        (className ?? "")
      }
      title={txHash}
    >
      {truncateHash(txHash)}
    </a>
  );
}
