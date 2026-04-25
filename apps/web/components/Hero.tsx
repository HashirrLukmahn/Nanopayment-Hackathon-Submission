import { Badge } from "./ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--accent)/0.08),_transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24">
        <Badge variant="accent" className="mb-6">Built on Circle Arc · Nanopayments · Gemini 2.5 Flash</Badge>
        <h1 className="font-serif text-display-lg md:text-display-xl leading-[0.95] tracking-tight text-foreground max-w-4xl">
          Negative results are <span className="text-accent">worth money</span>.<br />
          Nobody has ever paid for them.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Luqman is a pay-per-query knowledge marketplace for the research that never gets published —
          the failed experiments, the ruled-out compounds, the dead-end hyperparameters. AI agents pay
          a few cents per citation. Researchers finally get paid for what they <em>actually</em> learned.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <a
            href="#demo"
            className="inline-flex h-11 items-center rounded-md bg-accent px-5 font-medium text-accent-foreground hover:brightness-110 transition"
          >
            See it pay in real time →
          </a>
          <a
            href="/researcher"
            className="inline-flex h-11 items-center rounded-md border border-border px-5 text-foreground hover:bg-muted transition"
          >
            For researchers
          </a>
        </div>
        <div className="mt-12 grid gap-6 border-t border-border pt-8 text-sm md:grid-cols-3">
          <Stat label="Split" value="85 / 15" sub="researcher / platform" />
          <Stat label="Chunk price" value="$0.005" sub="deterministic, on-chain" />
          <Stat label="Settlement" value="seconds" sub="Circle Nanopayments on Arc" />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-3xl text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
