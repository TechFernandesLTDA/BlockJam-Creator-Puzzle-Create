import type { FastifyInstance } from 'fastify';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, levels, playSessions } from '../db/schema.js';
import { verifyAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { updateProfileSchema } from '@blockjam/shared';
import { logger } from '../utils/logger.js';
import type { z } from 'zod';

export default async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/users/me
   *
   * Get the authenticated user's profile.
   */
  fastify.get(
    '/api/users/me',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, request.user!.id))
          .limit(1);

        if (userResult.length === 0) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const user = userResult[0]!;

        return reply.send({
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
          lastActiveAt: user.lastActiveAt.toISOString(),
        });
      } catch (err) {
        logger.error({ err }, 'Error fetching user profile');
        return reply.status(500).send({ error: 'Failed to fetch profile' });
      }
    },
  );

  /**
   * PATCH /api/users/me
   *
   * Update the authenticated user's profile (displayName, avatarUrl).
   */
  fastify.patch(
    '/api/users/me',
    { preHandler: [verifyAuth, validateBody(updateProfileSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof updateProfileSchema>;

        const updateData: Record<string, unknown> = {};

        if (body.displayName !== undefined) {
          updateData.displayName = body.displayName;
        }

        if (body.avatarUrl !== undefined) {
          updateData.avatarUrl = body.avatarUrl;
        }

        if (Object.keys(updateData).length === 0) {
          return reply.status(400).send({ error: 'No fields to update' });
        }

        const updatedUsers = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, request.user!.id))
          .returning();

        if (updatedUsers.length === 0) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const user = updatedUsers[0]!;

        return reply.send({
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
          lastActiveAt: user.lastActiveAt.toISOString(),
        });
      } catch (err) {
        logger.error({ err }, 'Error updating user profile');
        return reply.status(500).send({ error: 'Failed to update profile' });
      }
    },
  );

  /**
   * GET /api/users/me/levels
   *
   * Get levels created by the authenticated user.
   */
  fastify.get(
    '/api/users/me/levels',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const userLevels = await db
          .select({
            id: levels.id,
            name: levels.name,
            gridSize: levels.gridSize,
            difficulty: levels.difficulty,
            targetLines: levels.targetLines,
            maxMoves: levels.maxMoves,
            thumbnailUrl: levels.thumbnailUrl,
            likesCount: levels.likesCount,
            playsCount: levels.playsCount,
            completionRate: levels.completionRate,
            isOfficial: levels.isOfficial,
            isFeatured: levels.isFeatured,
            isActive: levels.isActive,
            createdAt: levels.createdAt,
            updatedAt: levels.updatedAt,
          })
          .from(levels)
          .where(eq(levels.creatorId, request.user!.id))
          .orderBy(desc(levels.createdAt));

        const result = userLevels.map((level) => ({
          ...level,
          creatorId: request.user!.id,
          creatorName: request.user!.displayName,
          creatorAvatar: null,
          isLiked: false,
          createdAt: level.createdAt.toISOString(),
          updatedAt: level.updatedAt.toISOString(),
        }));

        return reply.send({ levels: result });
      } catch (err) {
        logger.error({ err }, 'Error fetching user levels');
        return reply.status(500).send({ error: 'Failed to fetch levels' });
      }
    },
  );

  /**
   * GET /api/users/me/stats
   *
   * Get detailed stats for the authenticated user.
   */
  fastify.get(
    '/api/users/me/stats',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const userId = request.user!.id;

        // Get user base data
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userResult.length === 0) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const user = userResult[0]!;

        // Count completed levels
        const completedResult = await db
          .select({
            count: sql<number>`count(DISTINCT ${playSessions.levelId})::int`,
          })
          .from(playSessions)
          .where(
            and(
              eq(playSessions.userId, userId),
              eq(playSessions.completed, true),
            ),
          );

        const levelsCompleted = completedResult[0]?.count ?? 0;

        // Total score across all sessions
        const totalScoreResult = await db
          .select({
            total: sql<number>`coalesce(sum(${playSessions.score}), 0)::int`,
          })
          .from(playSessions)
          .where(eq(playSessions.userId, userId));

        const totalScore = totalScoreResult[0]?.total ?? 0;

        // Average completion rate of user's created levels
        const avgCompletionResult = await db
          .select({
            avg: sql<number>`coalesce(avg(${levels.completionRate}), 0)::real`,
          })
          .from(levels)
          .where(
            and(
              eq(levels.creatorId, userId),
              eq(levels.isActive, true),
            ),
          );

        const avgCompletionRate = Math.round(avgCompletionResult[0]?.avg ?? 0);

        // Calculate rank (position by totalLikes)
        const rankResult = await db
          .select({
            rank: sql<number>`(
              SELECT count(*) + 1 FROM users u2 WHERE u2.total_likes > ${users.totalLikes}
            )::int`,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const rank = rankResult[0]?.rank ?? 0;

        return reply.send({
          totalScore,
          totalLikes: user.totalLikes,
          levelsCreated: user.levelsCreated,
          levelsPlayed: user.levelsPlayed,
          levelsCompleted,
          highScore: user.highScore,
          avgCompletionRate,
          rank,
        });
      } catch (err) {
        logger.error({ err }, 'Error fetching user stats');
        return reply.status(500).send({ error: 'Failed to fetch stats' });
      }
    },
  );

  /**
   * GET /api/users/ranking
   *
   * Top creators ranked by totalLikes.
   */
  fastify.get('/api/users/ranking', async (_request, reply) => {
    try {
      const topCreators = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          totalLikes: users.totalLikes,
          levelsCreated: users.levelsCreated,
          highScore: users.highScore,
        })
        .from(users)
        .orderBy(desc(users.totalLikes))
        .limit(50);

      const result = topCreators.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        totalLikes: user.totalLikes,
        levelsCreated: user.levelsCreated,
        highScore: user.highScore,
      }));

      return reply.send({ rankings: result });
    } catch (err) {
      logger.error({ err }, 'Error fetching rankings');
      return reply.status(500).send({ error: 'Failed to fetch rankings' });
    }
  });
}
