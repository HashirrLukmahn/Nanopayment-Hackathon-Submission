import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { scalekit, COOKIE } from '@/lib/scalekit';

/**
 * POST /api/auth/refresh
 *
 * Called automatically by the client ~60 s before the access token expires.
 * Rotates both tokens (Scalekit issues a new refresh token on every refresh).
 */
export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get(COOKIE.REFRESH)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 });
  }

  let result: Awaited<ReturnType<typeof scalekit.refreshAccessToken>>;
  try {
    result = await scalekit.refreshAccessToken(refreshToken);
  } catch {
    const res = NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
    res.cookies.delete(COOKIE.ACCESS);
    res.cookies.delete(COOKIE.REFRESH);
    return res;
  }

  const { accessToken, refreshToken: newRefreshToken } = result;
  // RefreshTokenResponse doesn't include expiresIn — use a safe default (4 min).
  const ACCESS_TOKEN_LIFETIME_S = 240;

  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE.ACCESS, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_LIFETIME_S * 1000,
    path: '/',
  });

  res.cookies.set(COOKIE.REFRESH, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
  });

  return res;
}
