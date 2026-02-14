import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { validateBody } from '../middleware/validation.js';
import { googleAuthSchema, guestAuthSchema } from '@blockjam/shared';
import { logger } from '../utils/logger.js';

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/auth/google
   *
   * Authenticate with a Google ID token via Firebase.
   * For now, simulates Firebase validation: accepts any token and
   * creates or finds a user based on a derived firebaseUid.
   */
  fastify.post(
    '/api/auth/google',
    { preHandler: [validateBody(googleAuthSchema)] },
    async (request, reply) => {
      try {
        const { idToken } = request.body as { idToken: string };

        // Simulated Firebase token verification
        // In production, you would use firebase-admin:
        //   const decodedToken = await admin.auth().verifyIdToken(idToken);
        //   const firebaseUid = decodedToken.uid;
        const firebaseUid = `google-${idToken.substring(0, 32)}`;
        const simulatedName =
          `User_${idToken.substring(0, 8)}`;

        // Check if user exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.firebaseUid, firebaseUid))
          .limit(1);

        if (existingUser.length > 0) {
          const user = existingUser[0]!;

          // Update lastActiveAt
          await db
            .update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, user.id));

          return reply.send({
            user: {
              id: user.id,
              firebaseUid: user.firebaseUid,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              coins: user.coins,
              totalLikes: user.totalLikes,
              levelsCreated: user.levelsCreated,
              levelsPlayed: user.levelsPlayed,
              highScore: user.highScore,
              isPremium: user.isPremium,
              createdAt: user.createdAt.toISOString(),
              lastActiveAt: new Date().toISOString(),
            },
            token: user.firebaseUid,
          });
        }

        // Create new user
        const newUsers = await db
          .insert(users)
          .values({
            firebaseUid,
            displayName: simulatedName,
            coins: 100,
          })
          .returning();

        const newUser = newUsers[0]!;

        logger.info({ userId: newUser.id }, 'New Google user created');

        return reply.status(201).send({
          user: {
            id: newUser.id,
            firebaseUid: newUser.firebaseUid,
            displayName: newUser.displayName,
            avatarUrl: newUser.avatarUrl,
            coins: newUser.coins,
            totalLikes: newUser.totalLikes,
            levelsCreated: newUser.levelsCreated,
            levelsPlayed: newUser.levelsPlayed,
            highScore: newUser.highScore,
            isPremium: newUser.isPremium,
            createdAt: newUser.createdAt.toISOString(),
            lastActiveAt: newUser.lastActiveAt.toISOString(),
          },
          token: newUser.firebaseUid,
        });
      } catch (err) {
        logger.error({ err }, 'Google auth error');
        return reply.status(500).send({ error: 'Authentication failed' });
      }
    },
  );

  /**
   * POST /api/auth/guest
   *
   * Create or find a guest user by device ID.
   */
  fastify.post(
    '/api/auth/guest',
    { preHandler: [validateBody(guestAuthSchema)] },
    async (request, reply) => {
      try {
        const { deviceId } = request.body as { deviceId: string };
        const firebaseUid = `guest-${deviceId}`;

        // Check if guest user exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.firebaseUid, firebaseUid))
          .limit(1);

        if (existingUser.length > 0) {
          const user = existingUser[0]!;

          await db
            .update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, user.id));

          return reply.send({
            user: {
              id: user.id,
              firebaseUid: user.firebaseUid,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              coins: user.coins,
              totalLikes: user.totalLikes,
              levelsCreated: user.levelsCreated,
              levelsPlayed: user.levelsPlayed,
              highScore: user.highScore,
              isPremium: user.isPremium,
              createdAt: user.createdAt.toISOString(),
              lastActiveAt: new Date().toISOString(),
            },
            token: user.firebaseUid,
          });
        }

        // Create new guest user
        const guestName = `Guest_${deviceId.substring(0, 6)}`;

        const newUsers = await db
          .insert(users)
          .values({
            firebaseUid,
            displayName: guestName,
            coins: 100,
          })
          .returning();

        const newUser = newUsers[0]!;

        logger.info({ userId: newUser.id }, 'New guest user created');

        return reply.status(201).send({
          user: {
            id: newUser.id,
            firebaseUid: newUser.firebaseUid,
            displayName: newUser.displayName,
            avatarUrl: newUser.avatarUrl,
            coins: newUser.coins,
            totalLikes: newUser.totalLikes,
            levelsCreated: newUser.levelsCreated,
            levelsPlayed: newUser.levelsPlayed,
            highScore: newUser.highScore,
            isPremium: newUser.isPremium,
            createdAt: newUser.createdAt.toISOString(),
            lastActiveAt: newUser.lastActiveAt.toISOString(),
          },
          token: newUser.firebaseUid,
        });
      } catch (err) {
        logger.error({ err }, 'Guest auth error');
        return reply.status(500).send({ error: 'Authentication failed' });
      }
    },
  );
}
