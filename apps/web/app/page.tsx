import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { AgentDemo } from "@/components/AgentDemo";
import { ProblemStatement } from "@/components/ProblemStatement";
import { PricingTiers } from "@/components/PricingTiers";

export default function Page() {
  return (
    <main>
      <Header />
      <Hero />
      <ProblemStatement />
      <section id="demo" className="border-b border-border bg-muted/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8 max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-accent mb-3">Live demo</div>
            <h2 className="font-serif text-4xl leading-tight tracking-tight">Ask a question. Watch money move.</h2>
            <p className="mt-3 text-muted-foreground">
              An API key is auto-provisioned when this page loads. Every query hits Gemini,
              retrieves chunks keyword-first, and triggers one on-chain payment per citation on
              Circle Arc testnet. Click any tx hash to verify.
            </p>
          </div>
          <AgentDemo />
        </div>
      </section>
      <PricingTiers />
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>Luqman · the library of failed experiments</div>
          <div className="flex gap-4">
            <a href="/researcher" className="hover:text-foreground transition">Researchers</a>
            <a href="/admin" className="hover:text-foreground transition">Admin</a>
            <a href="https://github.com/luqman-hackathon/luqman" target="_blank" rel="noreferrer" className="hover:text-foreground transition">Source</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
