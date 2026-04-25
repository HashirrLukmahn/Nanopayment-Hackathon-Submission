import path from 'node:path';
import { config } from 'dotenv';

// Load from monorepo root so `pnpm dev` from apps/api/ picks up the right .env
config({ path: path.resolve(process.cwd(), '../../.env') });
config(); // also try CWD as fallback (works when run from root)
import { z } from 'zod';

/**
 * Environment schema. DATABASE_URL is required; Circle and Gemini keys are
 * optional so the server can boot in degraded/mock mode. Missing optional
 * keys are warned about at startup so the operator notices.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PORT: z.coerce.number().int().positive().default(3001),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Circle
  CIRCLE_API_KEY: z.string().optional(),
  CIRCLE_ENTITY_SECRET: z.string().optional(),
  CIRCLE_WALLET_SET_ID: z.string().optional(),
  ARC_RPC_URL: z.string().url().default('https://testnet-rpc.arc.network'),
  ARC_EXPLORER_URL: z.string().url().default('https://explorer.arc.network'),
  LUQMAN_FAUCET_WALLET_ID: z.string().optional(),
  LUQMAN_FAUCET_PRIVATE_KEY: z.string().optional(),

  // Gemini
  GOOGLE_AI_STUDIO_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // Contracts
  LUQMAN_ATTRIBUTION_ADDRESS: z.string().optional(),
  LUQMAN_TREASURY_ADDRESS: z.string().optional(),

  // Pricing
  PRICE_PER_CHUNK_USDC: z.string().default('0.008'),
  RESEARCHER_SHARE_BPS: z.coerce.number().int().min(0).max(10000).default(8500),
  PLATFORM_SHARE_BPS: z.coerce.number().int().min(0).max(10000).default(1500),

  // Nanopayments runtime mode: 'real' (default) or 'mock' (deterministic fake txs).
  NANOPAYMENTS_MODE: z.enum(['real', 'mock']).default('real'),

  API_BASE_URL: z.string().url().default('http://localhost:3001'),

  // Scalekit (optional — required when AUTH_MODE=bearer)
  SCALEKIT_ENVIRONMENT_URL: z.string().url().optional(),
  SCALEKIT_CLIENT_ID: z.string().optional(),
  SCALEKIT_CLIENT_SECRET: z.string().optional(),
  // Set to '1' to also accept X-API-Key (local dev / seed scripts)
  ALLOW_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env: Env = parsed.data;

// Warn about missing optional keys that will silently degrade functionality.
const warnings: string[] = [];
if (!env.CIRCLE_API_KEY) warnings.push('CIRCLE_API_KEY missing — wallet provisioning will mock');
if (!env.GOOGLE_AI_STUDIO_API_KEY) warnings.push('GOOGLE_AI_STUDIO_API_KEY missing — Gemini calls will mock');
if (!env.LUQMAN_FAUCET_WALLET_ID) warnings.push('LUQMAN_FAUCET_WALLET_ID missing — nanopayments require a funded faucet');
if (env.RESEARCHER_SHARE_BPS + env.PLATFORM_SHARE_BPS !== 10000) {
  warnings.push(
    `RESEARCHER_SHARE_BPS (${env.RESEARCHER_SHARE_BPS}) + PLATFORM_SHARE_BPS (${env.PLATFORM_SHARE_BPS}) != 10000`,
  );
}
if (warnings.length > 0) {
  for (const w of warnings) console.warn(`[env] ${w}`);
}
