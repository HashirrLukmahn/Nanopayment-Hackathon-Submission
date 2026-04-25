import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../lib/errors';

/**
 * Idempotency plugin for POST /query. LEARN #2 for Hashirr.
 *
 * CONTRACT (see CLAUDE_CODE_SPEC.md § LEARN #2):
 *  - Require `Idempotency-Key` header on POST /query; 400 if missing.
 *  - First hit with a new key:
 *      - Insert a PENDING row keyed by (key, sha256(body)) in idempotency_records.
 *      - Run the handler.
 *      - On success, UPDATE the row to COMPLETED with the response body + status.
 *  - Duplicate request with SAME key AND SAME body-hash:
 *      - If status = COMPLETED: short-circuit and return the cached response.
 *      - If status = PENDING:  respond 409 Conflict (another in-flight request).
 *  - Duplicate request with SAME key but DIFFERENT body-hash: 409 Conflict.
 *  - Handler throws: do NOT cache. Remove the PENDING row so a retry can try again.
 *  - Keys expire after 24h (background cleanup job is out of scope).
 *
 * STUB BEHAVIOUR
 * ──────────────
 * The current implementation only enforces the presence of the header. It
 * does not cache, does not detect body-hash collisions, does not guard against
 * in-flight duplicates. Hashirr to implement per the contract above.
 *
 * USEFUL HOOKS
 *  - Fastify `preHandler` lifecycle hook runs after the body is parsed but
 *    before the route handler — the right place to check for a cached response
 *    and short-circuit with `reply.send()`.
 *  - Use `onSend` to cache the response body after the handler has completed
 *    successfully. (`onError` is where you'd clear the PENDING row on throw.)
 *  - Body-hash: `createHash('sha256').update(JSON.stringify(request.body)).digest('hex')`.
 *  - Database row lifecycle:
 *      INSERT ... ON CONFLICT (key) DO NOTHING RETURNING *  — wins the race or returns nothing
 *      UPDATE ... SET status='completed', response_body=..., status_code=..., completed_at=now()
 */
export function idempotencyPlugin(fastify: FastifyInstance): void {
  fastify.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    if (request.method !== 'POST') return;
    if (!request.url.startsWith('/v1/query')) return;

    const key = request.headers['idempotency-key'];
    if (!key || typeof key !== 'string' || key.length < 8) {
      throw new ValidationError(
        'Missing or invalid Idempotency-Key header (must be a >=8 char string)',
      );
    }

    // TODO: LEARN #2 — Hashirr to implement:
    //   1. Compute bodyHash = sha256(JSON.stringify(request.body))
    //   2. Try INSERT INTO idempotency_records (key, request_hash, status)
    //        VALUES ($1, $2, 'pending') ON CONFLICT (key) DO NOTHING RETURNING *
    //   3. If the insert happened (returned a row), continue to handler.
    //   4. If it didn't (key exists), SELECT the existing row:
    //        - if request_hash != bodyHash → throw ConflictError('different body for same key')
    //        - if status = 'pending'        → throw ConflictError('request in flight')
    //        - if status = 'completed'      → reply.code(row.statusCode).send(row.responseBody); return
    //   5. Register an onSend hook that UPDATEs the row to 'completed' with the body.
    //   6. Register an onError hook that DELETEs the row (so retries can run again).
  });
}
