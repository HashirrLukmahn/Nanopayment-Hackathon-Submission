import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/scalekit';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

/** GET /api/wallets/me — proxies to Fastify GET /v1/wallets/me */
export async function GET() {
  const token = cookies().get(COOKIE.ACCESS)?.value;
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const res = await fetch(`${API_BASE}/v1/wallets/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
