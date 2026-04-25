import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { userWallets } from '../db/schema';
import { createUserWallet, getWalletBalance, fundFromFaucet } from '../services/circle-wallets';
import { UnauthorizedError } from '../lib/errors';
import { env } from '../env';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /users/provision
   *
   * Idempotent — safe to call on every login. Creates a Circle wallet for this
   * Scalekit user if one doesn't exist yet. Returns the wallet info either way.
   */
  fastify.post('/users/provision', async (request) => {
    if (!request.agent) throw new UnauthorizedError();
    const scalekitUserId = request.agent.id;

    // Already provisioned? Return existing.
    const existing = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.scalekitUserId, scalekitUserId))
      .limit(1);

    if (existing[0]) {
      return {
        walletId: existing[0].circleWalletId,
        address: existing[0].walletAddress,
        mocked: existing[0].mocked === 'true',
        created: false,
      };
    }

    // New user — provision a Circle wallet.
    const wallet = await createUserWallet(scalekitUserId);

    await db.insert(userWallets).values({
      scalekitUserId,
      circleWalletId: wallet.walletId,
      walletAddress: wallet.address,
      mocked: wallet.mocked ? 'true' : 'false',
    });

    return {
      walletId: wallet.walletId,
      address: wallet.address,
      mocked: wallet.mocked,
      created: true,
    };
  });

  /**
   * GET /wallets/me
   *
   * Returns this user's wallet address + live USDC balance from Circle.
   * Used by the dashboard wallet card.
   */
  fastify.get('/wallets/me', async (request) => {
    if (!request.agent) throw new UnauthorizedError();
    const scalekitUserId = request.agent.id;

    const rows = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.scalekitUserId, scalekitUserId))
      .limit(1);

    if (!rows[0]) {
      // Wallet not yet provisioned — return empty state.
      return {
        provisioned: false,
        address: null,
        balanceUsdc: '0.000000',
        explorerUrl: null,
      };
    }

    const { circleWalletId, walletAddress } = rows[0];
    const { usdc: balanceUsdc } = await getWalletBalance(circleWalletId);
    const explorerUrl = `${env.ARC_EXPLORER_URL.replace(/\/$/, '')}/address/${walletAddress}`;

    return {
      provisioned: true,
      walletId: circleWalletId,
      address: walletAddress,
      balanceUsdc,
      explorerUrl,
    };
  });

  /**
   * POST /wallets/faucet
   *
   * Transfers 1 USDC of testnet funds from the platform faucet wallet to the
   * calling user's wallet. One call = one top-up. Rate-limit by implementing
   * a cooldown in production; for the demo this is open.
   */
  fastify.post('/wallets/faucet', async (request) => {
    if (!request.agent) throw new UnauthorizedError();
    const scalekitUserId = request.agent.id;

    const rows = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.scalekitUserId, scalekitUserId))
      .limit(1);

    if (!rows[0]) {
      return { error: 'Wallet not provisioned. Call /users/provision first.' };
    }

    const { circleWalletId, walletAddress } = rows[0];
    const result = await fundFromFaucet(circleWalletId, walletAddress, '1.000000');

    return {
      ok: true,
      amount: '1.000000',
      toAddress: walletAddress,
      txHash: result.txHash,
      mocked: result.mocked,
    };
  });
}
