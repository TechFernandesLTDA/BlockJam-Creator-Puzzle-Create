import type { FastifyInstance } from 'fastify';
import { eq, and, sql, asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { levels, users, playSessions, likes } from '../db/schema.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { createLevelSchema } from '@blockjam/shared';
import { validateLevelData } from '../services/levelValidation.js';
import { calculateFeedScore } from '../services/feedAlgorithm.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

const playSessionSchema = z.object({
  score: z.number().int().min(0).default(0),
  movesUsed: z.number().int().min(0).default(0),
});

const completeSessionSchema = z.object({
  score: z.number().int().min(0),
  movesUsed: z.number().int().min(0),
  duration: z.number().int().min(0),
});

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'expert'] as const;

export default async function levelsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/levels/campaign
   *
   * Returns all official campaign levels ordered by difficulty.
   */
  fastify.get(
    '/api/levels/campaign',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const campaignLevels = await db
          .select({
            id: levels.id,
            name: levels.name,
            creatorId: levels.creatorId,
            gridSize: levels.gridSize,
            difficulty: levels.difficulty,
            targetLines: levels.targetLines,
            maxMoves: levels.maxMoves,
            levelData: levels.levelData,
            thumbnailUrl: levels.thumbnailUrl,
            likesCount: levels.likesCount,
            playsCount: levels.playsCount,
            completionRate: levels.completionRate,
            isOfficial: levels.isOfficial,
            isFeatured: levels.isFeatured,
            createdAt: levels.createdAt,
          })
          .from(levels)
          .where(
            and(eq(levels.isOfficial, true), eq(levels.isActive, true)),
          )
          .orderBy(asc(levels.createdAt));

        // Sort by difficulty order
        const sorted = campaignLevels.sort((a, b) => {
          const aIdx = DIFFICULTY_ORDER.indexOf(
            a.difficulty as (typeof DIFFICULTY_ORDER)[number],
          );
          const bIdx = DIFFICULTY_ORDER.indexOf(
            b.difficulty as (typeof DIFFICULTY_ORDER)[number],
          );
          return aIdx - bIdx;
        });

        // Check user likes if authenticated
        const userId = request.user?.id;
        let likedLevelIds = new Set<string>();
        if (userId) {
          const userLikes = await db
            .select({ levelId: likes.levelId })
            .from(likes)
            .where(eq(likes.userId, userId));
          likedLevelIds = new Set(userLikes.map((l) => l.levelId));
        }

        const result = sorted.map((level) => ({
          id: level.id,
          name: level.name,
          creatorId: level.creatorId,
          creatorName: 'BlockJam Official',
          creatorAvatar: null,
          gridSize: level.gridSize,
          difficulty: level.difficulty,
          targetLines: level.targetLines,
          maxMoves: level.maxMoves,
          levelData: level.levelData,
          thumbnailUrl: level.thumbnailUrl,
          likesCount: level.likesCount,
          playsCount: level.playsCount,
          completionRate: level.completionRate,
          isOfficial: level.isOfficial,
          isFeatured: level.isFeatured,
          isLiked: likedLevelIds.has(level.id),
          createdAt: level.createdAt.toISOString(),
        }));

        return reply.send({ levels: result });
      } catch (err) {
        logger.error({ err }, 'Error fetching campaign levels');
        return reply.status(500).send({ error: 'Failed to fetch campaign levels' });
      }
    },
  );

  /**
   * GET /api/levels/:id
   *
   * Get a single level with full details.
   */
  fastify.get(
    '/api/levels/:id',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await db
          .select({
            id: levels.id,
            name: levels.name,
            creatorId: levels.creatorId,
            creatorName: users.displayName,
            creatorAvatar: users.avatarUrl,
            gridSize: levels.gridSize,
            difficulty: levels.difficulty,
            targetLines: levels.targetLines,
            maxMoves: levels.maxMoves,
            levelData: levels.levelData,
            thumbnailUrl: levels.thumbnailUrl,
            likesCount: levels.likesCount,
            playsCount: levels.playsCount,
            completionRate: levels.completionRate,
            avgScore: levels.avgScore,
            isOfficial: levels.isOfficial,
            isFeatured: levels.isFeatured,
            isActive: levels.isActive,
            createdAt: levels.createdAt,
            updatedAt: levels.updatedAt,
          })
          .from(levels)
          .innerJoin(users, eq(levels.creatorId, users.id))
          .where(eq(levels.id, id))
          .limit(1);

        if (result.length === 0) {
          throw new NotFoundError('Level not found');
        }

        const level = result[0]!;

        // Check if current user has liked
        let isLiked = false;
        if (request.user) {
          const userLike = await db
            .select({ id: likes.id })
            .from(likes)
            .where(
              and(
                eq(likes.userId, request.user.id),
                eq(likes.levelId, id),
              ),
            )
            .limit(1);
          isLiked = userLike.length > 0;
        }

        return reply.send({
          ...level,
          isLiked,
          createdAt: level.createdAt.toISOString(),
          updatedAt: level.updatedAt.toISOString(),
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        logger.error({ err }, 'Error fetching level');
        return reply.status(500).send({ error: 'Failed to fetch level' });
      }
    },
  );

  /**
   * POST /api/levels
   *
   * Create a new level. Requires authentication.
   */
  fastify.post(
    '/api/levels',
    { preHandler: [verifyAuth, validateBody(createLevelSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createLevelSchema>;

        // Server-side validation of level data
        validateLevelData(body.levelData);

        // Calculate initial feed score
        const feedScore = calculateFeedScore({
          likesCount: 0,
          playsCount: 0,
          completionRate: 0,
          createdAt: new Date(),
        });

        const newLevels = await db
          .insert(levels)
          .values({
            creatorId: request.user!.id,
            name: body.name,
            gridSize: body.gridSize,
            difficulty: body.difficulty,
            targetLines: body.targetLines,
            maxMoves: body.maxMoves,
            levelData: body.levelData,
            feedScore,
          })
          .returning();

        const newLevel = newLevels[0]!;

        // Increment user's levelsCreated count
        await db
          .update(users)
          .set({
            levelsCreated: sql`${users.levelsCreated} + 1`,
          })
          .where(eq(users.id, request.user!.id));

        logger.info(
          { levelId: newLevel.id, creatorId: request.user!.id },
          'Level created',
        );

        return reply.status(201).send({
          id: newLevel.id,
          name: newLevel.name,
          creatorId: newLevel.creatorId,
          gridSize: newLevel.gridSize,
          difficulty: newLevel.difficulty,
          targetLines: newLevel.targetLines,
          maxMoves: newLevel.maxMoves,
          levelData: newLevel.levelData,
          thumbnailUrl: newLevel.thumbnailUrl,
          likesCount: newLevel.likesCount,
          playsCount: newLevel.playsCount,
          completionRate: newLevel.completionRate,
          isOfficial: newLevel.isOfficial,
          isFeatured: newLevel.isFeatured,
          createdAt: newLevel.createdAt.toISOString(),
          updatedAt: newLevel.updatedAt.toISOString(),
        });
      } catch (err) {
        if (err instanceof Error && err.constructor.name === 'ValidationError') {
          return reply.status(400).send({ error: err.message });
        }
        logger.error({ err }, 'Error creating level');
        return reply.status(500).send({ error: 'Failed to create level' });
      }
    },
  );

  /**
   * DELETE /api/levels/:id
   *
   * Delete a level. Only the creator can delete their own level.
   */
  fastify.delete(
    '/api/levels/:id',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Find the level
        const result = await db
          .select({ id: levels.id, creatorId: levels.creatorId })
          .from(levels)
          .where(eq(levels.id, id))
          .limit(1);

        if (result.length === 0) {
          throw new NotFoundError('Level not found');
        }

        const level = result[0]!;

        if (level.creatorId !== request.user!.id) {
          throw new ForbiddenError('You can only delete your own levels');
        }

        // Soft delete by setting isActive to false
        await db
          .update(levels)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(levels.id, id));

        // Decrement user's levelsCreated count
        await db
          .update(users)
          .set({
            levelsCreated: sql`GREATEST(${users.levelsCreated} - 1, 0)`,
          })
          .where(eq(users.id, request.user!.id));

        logger.info(
          { levelId: id, userId: request.user!.id },
          'Level deleted',
        );

        return reply.send({ success: true });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        if (err instanceof ForbiddenError) {
          return reply.status(403).send({ error: err.message });
        }
        logger.error({ err }, 'Error deleting level');
        return reply.status(500).send({ error: 'Failed to delete level' });
      }
    },
  );

  /**
   * POST /api/levels/:id/play
   *
   * Record the start of a play session.
   */
  fastify.post(
    '/api/levels/:id/play',
    { preHandler: [verifyAuth, validateBody(playSessionSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as z.infer<typeof playSessionSchema>;

        // Verify level exists
        const levelResult = await db
          .select({ id: levels.id })
          .from(levels)
          .where(and(eq(levels.id, id), eq(levels.isActive, true)))
          .limit(1);

        if (levelResult.length === 0) {
          throw new NotFoundError('Level not found');
        }

        // Create play session
        const sessions = await db
          .insert(playSessions)
          .values({
            userId: request.user!.id,
            levelId: id,
            score: body.score,
            movesUsed: body.movesUsed,
            completed: false,
          })
          .returning();

        const session = sessions[0]!;

        // Increment plays count on level
        await db
          .update(levels)
          .set({
            playsCount: sql`${levels.playsCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(levels.id, id));

        // Increment user's levelsPlayed
        await db
          .update(users)
          .set({
            levelsPlayed: sql`${users.levelsPlayed} + 1`,
          })
          .where(eq(users.id, request.user!.id));

        return reply.status(201).send({
          sessionId: session.id,
          levelId: id,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        logger.error({ err }, 'Error recording play session');
        return reply.status(500).send({ error: 'Failed to record play session' });
      }
    },
  );

  /**
   * POST /api/levels/:id/complete
   *
   * Mark a level as completed, update stats.
   */
  fastify.post(
    '/api/levels/:id/complete',
    { preHandler: [verifyAuth, validateBody(completeSessionSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as z.infer<typeof completeSessionSchema>;

        // Verify level exists
        const levelResult = await db
          .select({
            id: levels.id,
            playsCount: levels.playsCount,
            completionRate: levels.completionRate,
            avgScore: levels.avgScore,
          })
          .from(levels)
          .where(and(eq(levels.id, id), eq(levels.isActive, true)))
          .limit(1);

        if (levelResult.length === 0) {
          throw new NotFoundError('Level not found');
        }

        const level = levelResult[0]!;

        // Create completed play session
        const sessions = await db
          .insert(playSessions)
          .values({
            userId: request.user!.id,
            levelId: id,
            score: body.score,
            movesUsed: body.movesUsed,
            duration: body.duration,
            completed: true,
          })
          .returning();

        const session = sessions[0]!;

        // Count total completed sessions for this level
        const completedCountResult = await db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(playSessions)
          .where(
            and(
              eq(playSessions.levelId, id),
              eq(playSessions.completed, true),
            ),
          );

        const completedCount = completedCountResult[0]?.count ?? 0;
        const totalPlays = level.playsCount > 0 ? level.playsCount : 1;
        const newCompletionRate = Math.round((completedCount / totalPlays) * 100);

        // Calculate new average score
        const avgScoreResult = await db
          .select({
            avg: sql<number>`coalesce(avg(score), 0)::real`,
          })
          .from(playSessions)
          .where(
            and(
              eq(playSessions.levelId, id),
              eq(playSessions.completed, true),
            ),
          );

        const newAvgScore = avgScoreResult[0]?.avg ?? 0;

        // Update level stats
        const feedScore = calculateFeedScore({
          likesCount: 0, // will be recalculated by the ranking updater
          playsCount: totalPlays,
          completionRate: newCompletionRate,
          createdAt: new Date(),
        });

        await db
          .update(levels)
          .set({
            completionRate: newCompletionRate,
            avgScore: newAvgScore,
            feedScore,
            updatedAt: new Date(),
          })
          .where(eq(levels.id, id));

        // Update user's high score if this is higher
        const userResult = await db
          .select({ highScore: users.highScore })
          .from(users)
          .where(eq(users.id, request.user!.id))
          .limit(1);

        if (userResult.length > 0 && body.score > userResult[0]!.highScore) {
          await db
            .update(users)
            .set({ highScore: body.score })
            .where(eq(users.id, request.user!.id));
        }

        return reply.send({
          sessionId: session.id,
          score: body.score,
          completionRate: newCompletionRate,
          avgScore: newAvgScore,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        logger.error({ err }, 'Error completing level');
        return reply.status(500).send({ error: 'Failed to complete level' });
      }
    },
  );
}
