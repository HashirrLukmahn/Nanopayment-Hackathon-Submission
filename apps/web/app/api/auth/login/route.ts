import { NextResponse } from 'next/server';
import { scalekit, REDIRECT_URI } from '@/lib/scalekit';

/**
 * GET /api/auth/login
 *
 * Redirects the browser to Scalekit's hosted login page.
 * Scalekit handles email/password, magic-link, SSO — everything.
 * After the user authenticates, Scalekit sends them back to /api/auth/callback.
 */
export async function GET() {
  const authUrl = scalekit.getAuthorizationUrl(REDIRECT_URI, {
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  });

  return NextResponse.redirect(authUrl);
}
