import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header } from "@/components/Header";
import { ResearcherEarnings } from "@/components/ResearcherEarnings";
import { WalletCard } from "@/components/WalletCard";
import { COOKIE } from "@/lib/scalekit";

/**
 * Researcher dashboard — requires a valid Scalekit access token cookie.
 * Unauthenticated visitors are sent to the login flow.
 */
export default function ResearcherPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE.ACCESS)?.value;

  if (!token) {
    redirect('/api/auth/login');
  }

  // Decode user info for display (no sig check — backend does the real validation)
  let userName = 'Researcher';
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) throw new Error('bad_jwt');
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { name?: string; email?: string; exp: number };

    // Expired? Let browser auth middleware handle it; redirect to login.
    if (payload.exp * 1000 < Date.now()) {
      redirect('/api/auth/login');
    }

    userName = payload.name ?? payload.email ?? 'Researcher';
  } catch {
    redirect('/api/auth/login');
  }

  return (
    <main>
      <Header />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
          <div className="text-xs uppercase tracking-widest text-accent mb-3">Researcher dashboard</div>
          <h1 className="font-serif text-4xl tracking-tight leading-tight">
            Every citation is a receipt.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Welcome, <span className="text-foreground font-medium">{userName}</span>.
            Pick a researcher to see their uploads, per-chunk retrieval counts, and cumulative
            earnings. Earnings are the sum of all ledger credits to their wallet account —
            which you can verify against the on-chain nanopayment history.
          </p>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
          <WalletCard />
          <ResearcherEarnings />
        </div>
      </section>
    </main>
  );
}
