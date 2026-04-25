import { Card, CardBody, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const TIERS = [
  {
    name: "Open",
    badge: "default" as const,
    price: "$0.005",
    sub: "per chunk",
    desc: "Public preprints, methods, and reproduced results. Indexed by Gemini with standard retrieval weights.",
    lines: ["Free for researchers to upload", "Indexed corpus-wide", "Standard 85 / 15 split"],
  },
  {
    name: "Validated",
    badge: "accent" as const,
    price: "$0.015",
    sub: "per chunk",
    desc: "Peer-replicated failed experiments, with signed attestations. Retrieval gets a 3× relevance boost in ranking.",
    lines: ["Replication signature required", "3× retrieval weight", "Featured on researcher profile"],
  },
  {
    name: "Dark Knowledge",
    badge: "warning" as const,
    price: "$0.05",
    sub: "per chunk",
    desc: "Proprietary failed runs from industrial labs. Access gated by agent allowlist. Only surfaces when explicitly scoped.",
    lines: ["Allowlist-gated", "Encrypted at rest", "10× retrieval weight for scoped agents"],
  },
];

export function PricingTiers() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-accent mb-3">Pricing</div>
          <h2 className="font-serif text-4xl leading-tight tracking-tight">Three tiers of negative knowledge.</h2>
          <p className="mt-3 text-muted-foreground">
            Every chunk has a price. Every retrieval pays the researcher 85%. The split is enforced
            in basis points with ROUND_DOWN rounding — platform picks up the crumb.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card key={t.name} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{t.name}</CardTitle>
                  <Badge variant={t.badge}>{t.name === "Open" ? "free upload" : t.name === "Validated" ? "3× boost" : "gated"}</Badge>
                </div>
              </CardHeader>
              <CardBody className="flex-1 flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-4xl text-foreground tabular-nums">{t.price}</span>
                  <span className="text-sm text-muted-foreground">{t.sub}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                <ul className="mt-5 space-y-2 text-sm text-foreground/80">
                  {t.lines.map((l) => (
                    <li key={l} className="flex gap-2">
                      <span className="text-accent">·</span> {l}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
