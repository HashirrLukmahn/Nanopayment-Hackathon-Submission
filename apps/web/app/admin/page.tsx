import { Header } from "@/components/Header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <main>
      <Header />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
          <div className="text-xs uppercase tracking-widest text-accent mb-3">Admin</div>
          <h1 className="font-serif text-4xl tracking-tight leading-tight">System health & invariants.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Anything marked <Badge variant="warning" className="ml-1">LEARN</Badge> is an intentional
            stub for Hashirr to hand-implement — core double-entry atomicity, idempotency caching,
            and the on-chain attribution contract. The rest of the system runs end-to-end.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>LEARN #1 — Double-entry ledger atomicity</CardTitle>
                <Badge variant="warning">stub</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-foreground/80 leading-relaxed">
              <p>
                <code className="font-mono text-xs text-accent">apps/api/src/services/ledger.ts</code> currently writes the three
                entries (debit agent / credit researcher / credit platform) as three separate inserts.
                If the process dies between inserts, the ledger becomes unbalanced. Your job is to
                wrap them in <code className="font-mono text-xs">db.transaction()</code> so the debit and both credits are
                atomic — and to add an assertion at commit time that the sum-of-credits minus
                sum-of-debits is zero for the affected accounts.
              </p>
              <p className="text-muted-foreground">
                Hint: Drizzle exposes <code className="font-mono text-xs">await db.transaction(async (tx) =&gt; {"{"} … {"}"})</code>. Use tx, not db, inside.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>LEARN #2 — Idempotency middleware</CardTitle>
                <Badge variant="warning">stub</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-foreground/80 leading-relaxed">
              <p>
                <code className="font-mono text-xs text-accent">apps/api/src/middleware/idempotency.ts</code> currently only checks for
                the <code className="font-mono text-xs">Idempotency-Key</code> header's existence. Real implementation: look up
                the key, compare request body hash, and if a completed response exists for that
                key return it verbatim. Mark rows pending before handling and completed on success
                — otherwise two near-simultaneous requests race each other.
              </p>
              <p className="text-muted-foreground">
                Hint: the <code className="font-mono text-xs">idempotency_records</code> table is already shaped for this.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>LEARN #3 — LuqmanAttribution.sol</CardTitle>
                <Badge variant="warning">stub</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-foreground/80 leading-relaxed">
              <p>
                <code className="font-mono text-xs text-accent">packages/contracts/src/LuqmanAttribution.sol</code> contains the full
                event signatures, storage, errors, and 10 Foundry tests — but every function body
                currently reverts with <code className="font-mono text-xs">LearnNotImplemented</code>. Implement
                <code className="font-mono text-xs"> registerResearcher</code> and
                <code className="font-mono text-xs"> recordRetrievalBatch</code>. Watch the tests pass one by one.
              </p>
              <p className="text-muted-foreground">
                Hint: the tests already encode the 85/15 split, rounding crumb, and reentrancy
                expectations. Let them drive your implementation.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </main>
  );
}
