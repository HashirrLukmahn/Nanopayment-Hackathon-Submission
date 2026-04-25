import { ScalekitClient } from '@scalekit-sdk/node';

/**
 * Singleton Scalekit client for the Next.js web app.
 * Used by auth API route handlers (login, callback, refresh, logout).
 *
 * Env vars required:
 *   SCALEKIT_ENVIRONMENT_URL   e.g. https://yourapp.scalekit.dev
 *   SCALEKIT_CLIENT_ID         e.g. skc_...
 *   SCALEKIT_CLIENT_SECRET     e.g. test_...
 */
export const scalekit = new ScalekitClient(
  process.env.SCALEKIT_ENVIRONMENT_URL!,
  process.env.SCALEKIT_CLIENT_ID!,
  process.env.SCALEKIT_CLIENT_SECRET!,
);

export const REDIRECT_URI =
  `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/callback`;

/** Cookie names — single source of truth. */
export const COOKIE = {
  ACCESS: 'luqman_access_token',
  REFRESH: 'luqman_refresh_token',
} as const;
