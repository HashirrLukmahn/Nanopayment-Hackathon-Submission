import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/scalekit';

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * GET /api/auth/logout
 *
 * Clears auth cookies and redirects to the homepage.
 */
export async function GET() {
  const res = NextResponse.redirect(new URL('/', APP_BASE));
  res.cookies.delete(COOKIE.ACCESS);
  res.cookies.delete(COOKIE.REFRESH);
  return res;
}
