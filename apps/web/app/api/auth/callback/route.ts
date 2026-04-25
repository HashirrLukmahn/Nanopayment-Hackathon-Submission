import { NextResponse } from 'next/server';
import { scalekit, REDIRECT_URI, COOKIE } from '@/lib/scalekit';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';
const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * GET /api/auth/callback?code=...
 *
 * Scalekit redirects here after the user authenticates.
 * 1. Exchange code for tokens
 * 2. Set httpOnly cookies
 * 3. Provision a Circle wallet for this user (idempotent — safe on every login)
 * 4. Redirect to researcher dashboard
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    const msg = encodeURIComponent(error ?? 'missing_code');
    return NextResponse.redirect(
      new URL(`/researcher?auth_error=${msg}`, APP_BASE),
    );
  }

  let authResult: Awaited<ReturnType<typeof scalekit.authenticateWithCode>>;
  try {
    authResult = await scalekit.authenticateWithCode(code, REDIRECT_URI);
  } catch (err) {
    console.error('[auth/callback] token exchange failed:', err);
    return NextResponse.redirect(
      new URL('/researcher?auth_error=token_exchange_failed', APP_BASE),
    );
  }

  const { accessToken, refreshToken, expiresIn } = authResult;

  // Provision a Circle wallet for this user (no-op if already exists).
  // Fire-and-forget — don't block the redirect if Circle is slow.
  fetch(`${API_BASE}/v1/users/provision`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch((err) => console.error('[auth/callback] wallet provision failed:', err));

  const res = NextResponse.redirect(new URL('/researcher', APP_BASE));

  res.cookies.set(COOKIE.ACCESS, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresIn - 60,   // seconds (Next.js cookies API matches Set-Cookie spec)
    path: '/',
  });

  res.cookies.set(COOKIE.REFRESH, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
  });

  return res;
}
