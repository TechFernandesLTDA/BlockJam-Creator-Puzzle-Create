import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Creates a Fastify preHandler hook that validates the request body
 * against the provided Zod schema. On validation failure, responds
 * with a 400 and the validation error details.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      return reply.status(400).send({
        error: 'Validation failed',
        details: zodError.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // Attach parsed data back to request body so handlers get typed data
    (request as { body: T }).body = result.data;
  };
}

/**
 * Creates a Fastify preHandler hook that validates query parameters
 * against the provided Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      const zodError = result.error as ZodError;
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: zodError.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    (request as { query: T }).query = result.data;
  };
}
