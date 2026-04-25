import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Full Luqman schema — one file, matches the spec 1:1.
 *
 * Money columns use `numeric(18,6)` and are manipulated in the application as
 * strings. Never parse them to JS `number` — IEEE-754 cannot represent 0.008
 * exactly. See services/ledger.ts and lib/money.ts.
 */

export const researchers = pgTable('researchers', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  walletAddress: text('wallet_address').notNull().unique(),
  walletId: text('wallet_id'), // Circle wallet id (nullable when using fake wallets)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const uploads = pgTable('uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  researcherId: uuid('researcher_id')
    .notNull()
    .references(() => researchers.id),
  title: text('title').notNull(),
  tier: text('tier', { enum: ['open', 'validated', 'dark'] }).notNull(),
  sourcePath: text('source_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    uploadId: uuid('upload_id')
      .notNull()
      .references(() => uploads.id),
    position: integer('position').notNull(),
    content: text('content').notNull(),
    tokenCount: integer('token_count').notNull(),
    keywordVector: text('keyword_vector').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uploadPosIdx: index('chunks_upload_pos_idx').on(t.uploadId, t.position),
  }),
);

export const queries = pgTable(
  'queries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: text('agent_id').notNull(),
    queryText: text('query_text').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    totalCostUsdc: numeric('total_cost_usdc', { precision: 18, scale: 6 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    idempotencyKeyIdx: uniqueIndex('queries_idempotency_key_idx').on(t.idempotencyKey),
  }),
);

export const retrievals = pgTable('retrievals', {
  id: uuid('id').primaryKey().defaultRandom(),
  queryId: uuid('query_id')
    .notNull()
    .references(() => queries.id),
  chunkId: uuid('chunk_id')
    .notNull()
    .references(() => chunks.id),
  priceUsdc: numeric('price_usdc', { precision: 18, scale: 6 }).notNull(),
  researcherShare: numeric('researcher_share', { precision: 18, scale: 6 }).notNull(),
  platformShare: numeric('platform_share', { precision: 18, scale: 6 }).notNull(),
  txHash: text('tx_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id').notNull(),
    accountId: text('account_id').notNull(),
    direction: text('direction', { enum: ['debit', 'credit'] }).notNull(),
    amountUsdc: numeric('amount_usdc', { precision: 18, scale: 6 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    txIdx: index('ledger_entries_tx_idx').on(t.transactionId),
    accountIdx: index('ledger_entries_account_idx').on(t.accountId),
  }),
);

/**
 * Idempotency records. `status` is used by the LEARN #2 middleware to
 * distinguish in-flight executions ('pending') from cacheable finished ones
 * ('completed'). `request_hash` lets us reject same-key-different-body
 * collisions with 409.
 */
export const idempotencyRecords = pgTable('idempotency_records', {
  key: text('key').primaryKey(),
  requestHash: text('request_hash').notNull(),
  status: text('status', { enum: ['pending', 'completed'] }).notNull().default('pending'),
  statusCode: integer('status_code'),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

/**
 * Per-user wallets. Maps a Scalekit user sub to a Circle Developer-Controlled
 * wallet. Created once on first login and reused across all sessions.
 * The `walletAddress` is the on-chain address visible on Arc explorer.
 */
export const userWallets = pgTable(
  'user_wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scalekitUserId: text('scalekit_user_id').notNull(),
    circleWalletId: text('circle_wallet_id').notNull(),
    walletAddress: text('wallet_address').notNull(),
    mocked: text('mocked').notNull().default('false'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scalekitUserIdx: uniqueIndex('user_wallets_scalekit_user_idx').on(t.scalekitUserId),
  }),
);

/**
 * API keys. Each agent is identified by the SHA-256 hash of their plaintext key.
 * `faucetWalletId` is the Circle wallet that covers the agent's payments during
 * the demo. In production, agents would hold their own funded wallets.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: text('agent_id').notNull(),
    keyHash: text('key_hash').notNull(),
    faucetWalletId: text('faucet_wallet_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => ({
    keyHashIdx: uniqueIndex('api_keys_key_hash_idx').on(t.keyHash),
  }),
);

export const schemaExport = {
  researchers,
  uploads,
  chunks,
  queries,
  retrievals,
  ledgerEntries,
  idempotencyRecords,
  apiKeys,
  userWallets,
};

// Re-export the raw SQL tag for ad-hoc queries (e.g. ledger aggregates).
export { sql };
