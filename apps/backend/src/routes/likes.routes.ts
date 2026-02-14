import type { FastifyInstance } from 'fastify';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { likes, levels, users } from '../db/schema.js';
import { verifyAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export default async function likesRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/likes/:levelId
   *
   * Add a like to a level. Inserts a like record and increments
   * the level's likesCount and the creator's totalLikes.
   */
  fastify.post(
    '/api/likes/:levelId',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const { levelId } = request.params as { levelId: string };
        const userId = request.user!.id;

        // Verify level exists
        const levelResult = await db
          .select({ id: levels.id, creatorId: levels.creatorId })
          .from(levels)
          .where(and(eq(levels.id, levelId), eq(levels.isActive, true)))
          .limit(1);

        if (levelResult.length === 0) {
          throw new NotFoundError('Level not found');
        }

        const level = levelResult[0]!;

        // Check if already liked
        const existingLike = await db
          .select({ id: likes.id })
          .from(likes)
          .where(
            and(eq(likes.userId, userId), eq(likes.levelId, levelId)),
          )
          .limit(1);

        if (existingLike.length > 0) {
          return reply.status(409).send({ error: 'Already liked this level' });
        }

        // Insert like
        await db.insert(likes).values({
          userId,
          levelId,
        });

        // Increment level likes count
        await db
          .update(levels)
          .set({
            likesCount: sql`${levels.likesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(levels.id, levelId));

        // Increment creator's total likes
        await db
          .update(users)
          .set({
            totalLikes: sql`${users.totalLikes} + 1`,
          })
          .where(eq(users.id, level.creatorId));

        logger.info({ userId, levelId }, 'Level liked');

        return reply.status(201).send({ success: true, liked: true });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        logger.error({ err }, 'Error liking level');
        return reply.status(500).send({ error: 'Failed to like level' });
      }
    },
  );

  /**
   * DELETE /api/likes/:levelId
   *
   * Remove a like from a level. Deletes the like record and decrements
   * the level's likesCount and the creator's totalLikes.
   */
  fastify.delete(
    '/api/likes/:levelId',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const { levelId } = request.params as { levelId: string };
        const userId = request.user!.id;

        // Verify level exists
        const levelResult = await db
          .select({ id: levels.id, creatorId: levels.creatorId })
          .from(levels)
          .where(eq(levels.id, levelId))
          .limit(1);

        if (levelResult.length === 0) {
          throw new NotFoundError('Level not found');
        }

        const level = levelResult[0]!;

        // Check if like exists
        const existingLike = await db
          .select({ id: likes.id })
          .from(likes)
          .where(
            and(eq(likes.userId, userId), eq(likes.levelId, levelId)),
          )
          .limit(1);

        if (existingLike.length === 0) {
          return reply.status(404).send({ error: 'Like not found' });
        }

        // Delete like
        await db
          .delete(likes)
          .where(
            and(eq(likes.userId, userId), eq(likes.levelId, levelId)),
          );

        // Decrement level likes count
        await db
          .update(levels)
          .set({
            likesCount: sql`GREATEST(${levels.likesCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(levels.id, levelId));

        // Decrement creator's total likes
        await db
          .update(users)
          .set({
            totalLikes: sql`GREATEST(${users.totalLikes} - 1, 0)`,
          })
          .where(eq(users.id, level.creatorId));

        logger.info({ userId, levelId }, 'Level unliked');

        return reply.send({ success: true, liked: false });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        logger.error({ err }, 'Error unliking level');
        return reply.status(500).send({ error: 'Failed to unlike level' });
      }
    },
  );
}
