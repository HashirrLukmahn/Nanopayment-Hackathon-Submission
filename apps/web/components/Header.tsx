import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/scalekit";

/**
 * Server component — reads the access token cookie to show
 * the logged-in user's name and a Sign Out link.
 */
export function Header() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE.ACCESS)?.value;

  let userName: string | null = null;
  if (token) {
    try {
      const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) throw new Error("bad_jwt");
    const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8"),
      ) as { name?: string; email?: string; exp: number };
      if (payload.exp * 1000 > Date.now()) {
        userName = payload.name ?? payload.email ?? "Researcher";
      }
    } catch {
      // malformed token — treat as logged out
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/luqman_logo.png" alt="Luqman" width={28} height={28} className="rounded-sm" />
          <span className="font-serif text-lg tracking-tight">Luqman</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">· the library of failed experiments</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition">Demo</Link>
          <Link href="/researcher" className="text-muted-foreground hover:text-foreground transition">Researchers</Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition">Admin</Link>

          {userName ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">{userName}</span>
              <Link
                href="/api/auth/logout"
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted transition"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <Link
              href="/api/auth/login"
              className="rounded-md bg-accent px-3 py-1 text-xs text-accent-foreground font-medium hover:opacity-90 transition"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
