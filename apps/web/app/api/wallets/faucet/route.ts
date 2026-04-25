import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/scalekit';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

/** POST /api/wallets/faucet — proxies to Fastify POST /v1/wallets/faucet */
export async function POST() {
  const token = cookies().get(COOKIE.ACCESS)?.value;
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const res = await fetch(`${API_BASE}/v1/wallets/faucet`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
