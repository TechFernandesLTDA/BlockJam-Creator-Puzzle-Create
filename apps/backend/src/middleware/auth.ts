import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  displayName: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] ?? null;
}

/**
 * Fastify preHandler hook that validates the auth token and attaches
 * the user to the request object.
 *
 * For now, the token is treated as the user's firebaseUid directly.
 * In production, this would verify a Firebase ID token or JWT.
 */
export async function verifyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const token = extractToken(request);

    if (!token) {
      throw new UnauthorizedError('Missing authentication token');
    }

    // Simulated auth: treat token as the firebaseUid or user id
    // In production, this would call firebase-admin to verify the ID token
    const user = await db
      .select({
        id: users.id,
        firebaseUid: users.firebaseUid,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.firebaseUid, token))
      .limit(1);

    if (user.length === 0) {
      // Try matching by user id as fallback.
      // Wrap in try/catch because token may not be a valid UUID,
      // which would cause a PostgreSQL cast error.
      try {
        const userById = await db
          .select({
            id: users.id,
            firebaseUid: users.firebaseUid,
            displayName: users.displayName,
          })
          .from(users)
          .where(eq(users.id, token))
          .limit(1);

        if (userById.length === 0) {
          throw new UnauthorizedError('Invalid authentication token');
        }

        request.user = userById[0];
      } catch (innerErr) {
        if (innerErr instanceof UnauthorizedError) throw innerErr;
        // Token is not a valid UUID — treat as invalid
        throw new UnauthorizedError('Invalid authentication token');
      }
    } else {
      request.user = user[0];
    }

    // Update lastActiveAt
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, request.user!.id));
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return reply.status(401).send({ error: err.message });
    }
    logger.error({ err }, 'Auth middleware error');
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

/**
 * Optional auth middleware - attaches user if token present, but does not
 * reject the request if no token is provided.
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const token = extractToken(request);

    if (!token) {
      return;
    }

    const user = await db
      .select({
        id: users.id,
        firebaseUid: users.firebaseUid,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.firebaseUid, token))
      .limit(1);

    if (user.length > 0) {
      request.user = user[0];
    } else {
      // Wrap in try/catch because token may not be a valid UUID
      try {
        const userById = await db
          .select({
            id: users.id,
            firebaseUid: users.firebaseUid,
            displayName: users.displayName,
          })
          .from(users)
          .where(eq(users.id, token))
          .limit(1);

        if (userById.length > 0) {
          request.user = userById[0];
        }
      } catch {
        // Token is not a valid UUID — ignore for optional auth
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Optional auth failed silently');
  }
}
