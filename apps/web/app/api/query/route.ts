import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/scalekit';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

/**
 * BFF proxy for POST /v1/query.
 *
 * Auth priority:
 *  1. Logged-in user: Authorization: Bearer from the httpOnly cookie.
 *     Their personal Circle wallet gets debited.
 *  2. Public demo: X-API-Key from the request header (ALLOW_API_KEY=1 on backend).
 *     The shared platform faucet gets debited.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const idempotencyKey = req.headers.get('idempotency-key') ?? '';

  const cookieStore = cookies();
  const accessToken = cookieStore.get(COOKIE.ACCESS)?.value;

  const authHeaders: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : { 'X-API-Key': req.headers.get('x-api-key') ?? '' };

  const res = await fetch(`${API_BASE}/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...authHeaders,
    },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  });
}
