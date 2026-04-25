import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/scalekit';

/**
 * GET /api/auth/me
 *
 * Returns the decoded user payload from the access token cookie.
 * The frontend uses this to show the logged-in user's name / email.
 * We decode locally (no Scalekit round-trip) — the backend does the
 * full cryptographic validation.
 */
export async function GET() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(COOKIE.ACCESS)?.value;

  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    // Decode the JWT payload (no signature check — that's the backend's job)
    const parts = accessToken.split('.');
    if (parts.length !== 3 || !parts[1]) throw new Error('malformed_jwt');
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as {
      sub: string;
      oid?: string;
      email?: string;
      name?: string;
      exp: number;
    };

    // Reject if expired (belt-and-suspenders — cookie maxAge should handle this)
    if (payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: payload.sub,
        orgId: payload.oid ?? null,
        email: payload.email ?? null,
        name: payload.name ?? null,
        expiresAt: payload.exp,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
