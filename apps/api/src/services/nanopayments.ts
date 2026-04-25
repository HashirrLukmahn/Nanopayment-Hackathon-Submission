import { createHash } from 'node:crypto';
import { env } from '../env';
import { logger } from '../logger';
import { UpstreamError } from '../lib/errors';
import type { UsdcAmount } from '../lib/money';

/**
 * Circle Nanopayments wrapper. Broadcasts a USDC transfer on Arc testnet and
 * returns the tx hash + block explorer URL.
 *
 * In mock mode (CIRCLE_API_KEY missing OR NANOPAYMENTS_MODE === 'mock') we
 * produce a deterministic fake tx hash so the demo pipeline runs end-to-end
 * without a funded Circle account.
 */

export interface NanopaymentArgs {
  fromWalletId: string;
  toAddress: string;
  amountUsdc: UsdcAmount;
  referenceId: string;
}

export interface NanopaymentResult {
  txHash: string;
  blockExplorerUrl: string;
  mocked: boolean;
}

function isMockMode(): boolean {
  return env.NANOPAYMENTS_MODE === 'mock' || !env.CIRCLE_API_KEY || !env.CIRCLE_ENTITY_SECRET;
}

function mockTxHash(referenceId: string): string {
  return `0x${createHash('sha256').update(referenceId).digest('hex').slice(0, 64)}`;
}

function explorerUrl(txHash: string): string {
  return `${env.ARC_EXPLORER_URL.replace(/\/$/, '')}/tx/${txHash}`;
}

let lazyClient: unknown | null = null;
async function getClient(): Promise<unknown> {
  if (lazyClient) return lazyClient;
  const mod = await import('@circle-fin/developer-controlled-wallets').catch(() => null);
  if (!mod || !env.CIRCLE_API_KEY || !env.CIRCLE_ENTITY_SECRET) {
    throw new UpstreamError('Circle SDK unavailable');
  }
  const init = (mod as { initiateDeveloperControlledWalletsClient?: Function })
    .initiateDeveloperControlledWalletsClient;
  if (!init) throw new UpstreamError('Circle SDK shape unexpected');
  lazyClient = init({ apiKey: env.CIRCLE_API_KEY, entitySecret: env.CIRCLE_ENTITY_SECRET });
  return lazyClient;
}

/**
 * Send a USDC nanopayment. Returns txHash + explorer URL. In mock mode, the
 * hash is deterministic from the referenceId so duplicate retries produce the
 * same hash (which is useful for idempotency testing).
 */
export async function sendNanopayment(args: NanopaymentArgs): Promise<NanopaymentResult> {
  if (isMockMode()) {
    const txHash = mockTxHash(args.referenceId);
    logger.warn(
      { txHash, ref: args.referenceId, amount: args.amountUsdc, to: args.toAddress },
      'nanopayment: mock mode',
    );
    return { txHash, blockExplorerUrl: explorerUrl(txHash), mocked: true };
  }

  try {
    const client = (await getClient()) as {
      createTransaction: (a: {
        walletId: string;
        destinationAddress: string;
        tokenId?: string;
        amounts: string[];
        blockchain?: string;
        fee: { type: 'level'; config: { feeLevel: 'LOW' | 'MEDIUM' | 'HIGH' } };
        refId?: string;
      }) => Promise<{ data?: { id: string; txHash?: string; state?: string } }>;
      getTransaction: (a: { id: string }) => Promise<{ data?: { transaction?: { txHash?: string; state?: string } } }>;
    };

    const created = await client.createTransaction({
      walletId: args.fromWalletId,
      destinationAddress: args.toAddress,
      amounts: [args.amountUsdc as unknown as string],
      blockchain: 'ARC-TESTNET',
      fee: { type: 'level', config: { feeLevel: 'LOW' } },
      refId: args.referenceId,
    });

    const id = created.data?.id;
    if (!id) throw new UpstreamError('createTransaction returned no id');

    // Poll for confirmation (budget ~5s).
    const deadline = Date.now() + 5_000;
    let txHash: string | undefined = created.data?.txHash;
    while (!txHash && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 400));
      const polled = await client.getTransaction({ id });
      txHash = polled.data?.transaction?.txHash;
    }
    if (!txHash) {
      logger.warn({ id }, 'nanopayment: tx hash not observed within 5s; returning placeholder');
      txHash = `pending-${id}`;
    }
    return { txHash, blockExplorerUrl: explorerUrl(txHash), mocked: false };
  } catch (err) {
    logger.error({ err }, 'nanopayment: real-mode failed, falling back to mock');
    const txHash = mockTxHash(args.referenceId);
    return { txHash, blockExplorerUrl: explorerUrl(txHash), mocked: true };
  }
}
