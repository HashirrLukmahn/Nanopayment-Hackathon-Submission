import { createHash } from 'node:crypto';
import { env } from '../env';
import { logger } from '../logger';
import { UpstreamError } from '../lib/errors';

/**
 * Circle Developer-Controlled Wallets wrapper.
 *
 * Real mode uses `@circle-fin/developer-controlled-wallets` to provision wallets
 * in the configured WALLET_SET. If CIRCLE_API_KEY is missing we fall back to
 * deterministic fake addresses so the rest of the app (seed scripts, demo) can
 * still run without a Circle account.
 */

function isMockMode(): boolean {
  return !env.CIRCLE_API_KEY || !env.CIRCLE_ENTITY_SECRET || !env.CIRCLE_WALLET_SET_ID;
}

function deterministicAddress(seed: string): string {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 40);
  return `0x${hex}`;
}

function deterministicWalletId(seed: string): string {
  return `mock-wallet-${createHash('sha256').update(seed).digest('hex').slice(0, 16)}`;
}

export interface CreatedWallet {
  walletId: string;
  address: string;
  mocked: boolean;
}

let lazyClient: unknown | null = null;

async function getClient(): Promise<unknown> {
  if (lazyClient) return lazyClient;
  // Dynamically import so the package isn't required at startup in mock mode.
  const mod = await import('@circle-fin/developer-controlled-wallets').catch(() => null);
  if (!mod || !env.CIRCLE_API_KEY || !env.CIRCLE_ENTITY_SECRET) {
    throw new UpstreamError('Circle SDK unavailable');
  }
  const init = (mod as { initiateDeveloperControlledWalletsClient?: Function })
    .initiateDeveloperControlledWalletsClient;
  if (!init) throw new UpstreamError('Circle SDK shape unexpected');
  lazyClient = init({
    apiKey: env.CIRCLE_API_KEY,
    entitySecret: env.CIRCLE_ENTITY_SECRET,
  });
  return lazyClient;
}

/**
 * Provision a wallet for a researcher or agent. In mock mode, returns a
 * deterministic address derived from the seed so re-running seed scripts is
 * idempotent.
 */
export async function createWallet(seed: string, refId: string): Promise<CreatedWallet> {
  if (isMockMode()) {
    logger.warn({ seed, refId }, 'circle: mock wallet (CIRCLE_API_KEY missing)');
    return {
      walletId: deterministicWalletId(seed),
      address: deterministicAddress(seed),
      mocked: true,
    };
  }

  try {
    const client = (await getClient()) as {
      createWallets: (args: {
        walletSetId: string;
        blockchains: string[];
        count: number;
        refId?: string;
      }) => Promise<{ data?: { wallets?: Array<{ id: string; address: string }> } }>;
    };
    const res = await client.createWallets({
      walletSetId: env.CIRCLE_WALLET_SET_ID!,
      blockchains: ['ARC-TESTNET'],
      count: 1,
      refId,
    });
    const wallet = res.data?.wallets?.[0];
    if (!wallet) throw new UpstreamError('Circle createWallets returned no wallet');
    return { walletId: wallet.id, address: wallet.address, mocked: false };
  } catch (err) {
    logger.error({ err, seed }, 'circle: createWallet failed, falling back to mock');
    return {
      walletId: deterministicWalletId(seed),
      address: deterministicAddress(seed),
      mocked: true,
    };
  }
}

export async function createResearcherWallet(displayName: string): Promise<CreatedWallet> {
  return createWallet(`researcher:${displayName}`, `researcher-${displayName}`);
}

export async function createAgentFaucetWallet(agentId: string): Promise<CreatedWallet> {
  return createWallet(`agent:${agentId}`, `agent-${agentId}`);
}

export async function createUserWallet(scalekitUserId: string): Promise<CreatedWallet> {
  return createWallet(`user:${scalekitUserId}`, `user-${scalekitUserId}`);
}

export interface WalletBalance {
  usdc: string;   // decimal string e.g. "4.980000"
  mocked: boolean;
}

/**
 * Get USDC balance for a Circle wallet.
 * In mock mode returns a deterministic fake balance of $5.00.
 */
export async function getWalletBalance(walletId: string): Promise<WalletBalance> {
  if (isMockMode()) {
    return { usdc: '5.000000', mocked: true };
  }

  try {
    const client = (await getClient()) as {
      getWalletTokenBalance: (a: { walletId: string }) => Promise<{
        data?: {
          tokenBalances?: Array<{ token?: { symbol: string }; amount: string }>;
        };
      }>;
    };
    const res = await client.getWalletTokenBalance({ walletId });
    const usdc = res.data?.tokenBalances?.find(
      (b) => b.token?.symbol === 'USDC',
    )?.amount ?? '0.000000';
    return { usdc, mocked: false };
  } catch (err) {
    logger.error({ err, walletId }, 'circle: getWalletBalance failed');
    return { usdc: '0.000000', mocked: true };
  }
}

/**
 * Transfer USDC from the platform faucet wallet to a user wallet.
 * Used for the "Add testnet funds" button in the demo.
 */
export async function fundFromFaucet(
  toWalletId: string,
  toAddress: string,
  amountUsdc = '1.000000',
): Promise<{ txHash: string; mocked: boolean }> {
  const faucetWalletId = env.LUQMAN_FAUCET_WALLET_ID;

  if (isMockMode() || !faucetWalletId) {
    logger.warn({ toWalletId, amountUsdc }, 'circle: mock faucet fund');
    return {
      txHash: deterministicWalletId(`faucet:${toWalletId}:${amountUsdc}`),
      mocked: true,
    };
  }

  try {
    const client = (await getClient()) as {
      createTransaction: (a: {
        walletId: string;
        destinationAddress: string;
        amounts: string[];
        blockchain?: string;
        fee: { type: 'level'; config: { feeLevel: string } };
        refId?: string;
      }) => Promise<{ data?: { id: string; txHash?: string } }>;
    };

    const res = await client.createTransaction({
      walletId: faucetWalletId,
      destinationAddress: toAddress,
      amounts: [amountUsdc],
      blockchain: 'ARC-TESTNET',
      fee: { type: 'level', config: { feeLevel: 'LOW' } },
      refId: `faucet-${toWalletId}-${Date.now()}`,
    });

    return {
      txHash: res.data?.txHash ?? res.data?.id ?? 'pending',
      mocked: false,
    };
  } catch (err) {
    logger.error({ err, toWalletId }, 'circle: fundFromFaucet failed');
    return { txHash: 'mock-faucet-tx', mocked: true };
  }
}
