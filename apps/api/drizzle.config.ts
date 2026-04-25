import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env from the monorepo root (two levels up from apps/api/)
config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
