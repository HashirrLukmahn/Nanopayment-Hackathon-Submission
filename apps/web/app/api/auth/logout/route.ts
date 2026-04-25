import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/scalekit';

/**
 * GET /api/auth/logout
 *
 * Clears auth cookies and redirects to the homepage.
 */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.delete(COOKIE.ACCESS);
  res.cookies.delete(COOKIE.REFRESH);
  return res;
}
