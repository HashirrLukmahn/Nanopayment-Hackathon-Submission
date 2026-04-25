import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import { ScalekitClient } from '@scalekit-sdk/node';
import { db } from '../db/client';
import { apiKeys, userWallets } from '../db/schema';
import { UnauthorizedError } from '../lib/errors';

/**
 * Dual-mode auth middleware.
 *
 * MODE 1 — Bearer (production / demo):
 *   Authorization: Bearer <scalekit-access-token>
 *   Token is verified against Scalekit via validateAccessToken().
 *   The JWT sub / oid are decoded locally for the `request.agent` payload.
 *
 * MODE 2 — X-API-Key (local dev / seed scripts):
 *   X-API-Key: <raw-key>
 *   Falls back to sha256 lookup in the `api_keys` table.
 *   Only active when ALLOW_API_KEY=1 in env.
 *
 * Downstream handlers read:
 *   request.agent = { id, faucetWalletId, apiKeyId }
 * (shape is unchanged so nothing else in the codebase needs to change)
 */

declare module 'fastify' {
  interface FastifyRequest {
    agent?: { id: string; faucetWalletId: string | null; apiKeyId: string };
  }
}

const PUBLIC_PATH_PREFIXES = [
  '/health',
  '/v1/agents/register',
  '/v1/researchers',   // read-only researcher list — no auth needed
  '/v1/earnings',      // read-only earnings — no auth needed
  '/docs',
];
const ALLOW_API_KEY = process.env.ALLOW_API_KEY === '1';

// Lazy-init Scalekit client — only if the env vars are present.
let _scalekit: ScalekitClient | null = null;
function getScalekit(): ScalekitClient | null {
  if (_scalekit) return _scalekit;
  const { SCALEKIT_ENVIRONMENT_URL, SCALEKIT_CLIENT_ID, SCALEKIT_CLIENT_SECRET } = process.env;
  if (!SCALEKIT_ENVIRONMENT_URL || !SCALEKIT_CLIENT_ID || !SCALEKIT_CLIENT_SECRET) return null;
  _scalekit = new ScalekitClient(
    SCALEKIT_ENVIRONMENT_URL,
    SCALEKIT_CLIENT_ID,
    SCALEKIT_CLIENT_SECRET,
  );
  return _scalekit;
}

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Decode a JWT payload without verifying the signature (crypto check is done by Scalekit). */
function decodePayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) throw new Error('malformed_jwt');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
}

export function apiKeyPlugin(fastify: FastifyInstance): void {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply) => {
    if (PUBLIC_PATH_PREFIXES.some((p) => request.url.startsWith(p))) return;

    // ── Bearer token path ─────────────────────────────────────────────────
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const sk = getScalekit();

      if (!sk) {
        request.log.warn('Bearer token received but SCALEKIT_* env vars not set');
        return reply.code(401).send({ error: 'scalekit_not_configured' });
      }

      let isValid: boolean;
      try {
        isValid = await sk.validateAccessToken(token);
      } catch (err) {
        request.log.warn({ err }, 'validateAccessToken threw');
        isValid = false;
      }

      if (!isValid) throw new UnauthorizedError();

      // Decode claims for downstream context (signature already verified above).
      const payload = decodePayload(token) as {
        sub: string;
        oid?: string;
        exp: number;
      };

      // Look up this user's provisioned Circle wallet.
      // Falls back to the shared faucet wallet if not yet provisioned
      // (provision is called in the auth callback, so this is a rare edge case).
      const walletRows = await db
        .select({ circleWalletId: userWallets.circleWalletId })
        .from(userWallets)
        .where(eq(userWallets.scalekitUserId, payload.sub))
        .limit(1);

      request.agent = {
        id: payload.sub,
        faucetWalletId: walletRows[0]?.circleWalletId ?? process.env.LUQMAN_FAUCET_WALLET_ID ?? null,
        apiKeyId: payload.sub,
      };
      return;
    }

    // ── X-API-Key fallback (dev only) ─────────────────────────────────────
    if (ALLOW_API_KEY) {
      const raw = request.headers['x-api-key'];
      if (raw && typeof raw === 'string') {
        const keyHash = hashKey(raw);
        const rows = await db
          .select({
            id: apiKeys.id,
            agentId: apiKeys.agentId,
            faucetWalletId: apiKeys.faucetWalletId,
          })
          .from(apiKeys)
          .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
          .limit(1);

        const row = rows[0];
        if (!row) throw new UnauthorizedError();

        request.agent = {
          id: row.agentId,
          faucetWalletId: row.faucetWalletId,
          apiKeyId: row.id,
        };
        return;
      }
    }

    throw new UnauthorizedError();
  });
}

export { hashKey };
