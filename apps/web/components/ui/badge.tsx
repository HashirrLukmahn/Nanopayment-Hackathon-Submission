import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "accent" | "success" | "warning" | "outline";

const variantCls: Record<Variant, string> = {
  default: "bg-muted text-foreground border border-border",
  accent: "bg-accent/15 text-accent border border-accent/30",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  outline: "bg-transparent text-muted-foreground border border-border",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tracking-tight",
        variantCls[variant],
        className,
      )}
      {...props}
    />
  );
}
