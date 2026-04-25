import Fastify, { type FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { env } from './env';
import { logger } from './logger';
import { AppError } from './lib/errors';
import { apiKeyPlugin } from './middleware/apiKey';
import { idempotencyPlugin } from './middleware/idempotency';
import { healthRoutes } from './routes/health';
import { agentRoutes } from './routes/agents';
import { earningsRoutes } from './routes/earnings';
import { uploadsRoutes } from './routes/uploads';
import { queryRoutes } from './routes/query';
import { userRoutes } from './routes/users';

/**
 * Fastify bootstrap. Registers plugins + routes, wires a JSON error handler,
 * and binds to env.PORT.
 */
async function buildServer() {
  // Cast the pino instance to FastifyBaseLogger so the FastifyInstance generic
  // resolves to the same shape that our plugins are typed against. Without the
  // cast, Fastify v4 widens the logger type to Pino's full Logger<never, boolean>
  // and apiKeyPlugin/idempotencyPlugin (typed against FastifyBaseLogger) reject it.
  const app = Fastify({
    logger: logger as unknown as FastifyBaseLogger,
    trustProxy: true,
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Idempotency-Key', 'Authorization'],
    credentials: true,
  });
  await app.register(sensible);

  // Global middleware: apiKey check first, then idempotency for /query.
  apiKeyPlugin(app);
  idempotencyPlugin(app);

  // Routes. Everything public-facing sits behind /v1/* so we can cut a v2 later
  // without breaking in-flight agents. `/health` stays unversioned.
  await app.register(healthRoutes);
  await app.register(
    async (v1) => {
      await v1.register(agentRoutes);
      await v1.register(earningsRoutes);
      await v1.register(uploadsRoutes);
      await v1.register(queryRoutes);
      await v1.register(userRoutes);
    },
    { prefix: '/v1' },
  );

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof AppError) {
      reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details },
      });
      return;
    }
    request.log.error({ err }, 'unhandled error');
    reply.code(500).send({
      error: { code: 'internal_error', message: err.message ?? 'Internal Server Error' },
    });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ error: { code: 'not_found', message: 'Route not found' } });
  });

  return app;
}

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, mode: env.NANOPAYMENTS_MODE },
      'luqman api listening',
    );
  } catch (err) {
    logger.error({ err }, 'failed to start server');
    process.exit(1);
  }
}

main();
