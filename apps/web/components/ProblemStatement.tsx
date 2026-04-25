export function ProblemStatement() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent mb-3">The file-drawer problem</div>
            <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground">
              The most valuable knowledge<br />
              in science is the knowledge<br />
              <span className="italic text-muted-foreground">nobody is allowed to sell.</span>
            </h2>
          </div>
          <div className="space-y-5 text-foreground/80 leading-relaxed">
            <p>
              Pharma, materials labs, and ML researchers all run thousands of experiments that
              <em> don't work</em>. A drug candidate that fails phase I. A fine-tune that collapses. A
              cathode formulation that degrades at 45°C. This is expensive, irreplaceable negative
              knowledge — and it sits on hard drives forever, because journals only publish wins.
            </p>
            <p>
              Meanwhile, AI agents are scaling out to millions of autonomous research queries. They'd
              happily pay for a citation that saves their principal three months of replicating a dead
              end. But there's no rail for them to pay with — credit card APIs can't settle five cents,
              and Stripe can't split it 85/15 between a researcher and a platform per call.
            </p>
            <p className="text-foreground">
              Luqman builds that rail. Every retrieval is a sub-cent on-chain payment split
              deterministically between the researcher and the platform — settled in seconds on
              Circle's Arc testnet. Agents pay. Researchers earn. Knowledge flows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
