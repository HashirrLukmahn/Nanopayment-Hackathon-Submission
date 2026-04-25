import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { apiKeys } from '../db/schema';
import { createAgentFaucetWallet } from '../services/circle-wallets';
import { hashKey } from '../middleware/apiKey';
import { ValidationError } from '../lib/errors';

const registerBodySchema = z.object({
  agentId: z.string().min(3).max(80),
});

export async function agentRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /agents/register
   *
   * Issues a plaintext API key (shown ONCE in the response) and provisions a
   * Circle faucet wallet for the agent. The key is stored as sha256 only.
   */
  fastify.post('/agents/register', async (request, reply) => {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid body', parsed.error.flatten());
    }
    const { agentId } = parsed.data;

    const plaintext = `luq_${randomBytes(16).toString('hex')}`;
    const keyHash = hashKey(plaintext);

    const wallet = await createAgentFaucetWallet(agentId);

    const [inserted] = await db
      .insert(apiKeys)
      .values({
        agentId,
        keyHash,
        faucetWalletId: wallet.walletId,
      })
      .returning({ id: apiKeys.id });

    reply.code(201);
    return {
      apiKey: plaintext,
      apiKeyId: inserted!.id,
      agentId,
      faucetWallet: {
        walletId: wallet.walletId,
        address: wallet.address,
        mocked: wallet.mocked,
      },
      hint: 'Store the apiKey securely — this is the only time it will be shown.',
    };
  });
}
