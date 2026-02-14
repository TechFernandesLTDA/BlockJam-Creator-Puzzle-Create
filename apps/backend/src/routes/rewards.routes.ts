import type { FastifyInstance } from 'fastify';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { users, rewards } from '../db/schema.js';
import { verifyAuth } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { calculateDailyReward, canClaimDaily } from '../services/rewardEngine.js';
import { logger } from '../utils/logger.js';

const rewardHistoryQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export default async function rewardsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/rewards/claim-daily
   *
   * Claim the daily login reward (25 coins, or 50 for premium).
   * Requires 24 hours between claims.
   */
  fastify.post(
    '/api/rewards/claim-daily',
    { preHandler: [verifyAuth] },
    async (request, reply) => {
      try {
        const userId = request.user!.id;

        // Get user details
        const userResult = await db
          .select({
            id: users.id,
            isPremium: users.isPremium,
            coins: users.coins,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userResult.length === 0) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const user = userResult[0]!;

        // Check last daily claim
        const lastClaimResult = await db
          .select({ createdAt: rewards.createdAt })
          .from(rewards)
          .where(
            and(
              eq(rewards.userId, userId),
              eq(rewards.type, 'daily_login'),
            ),
          )
          .orderBy(desc(rewards.createdAt))
          .limit(1);

        const lastClaim =
          lastClaimResult.length > 0 ? lastClaimResult[0]!.createdAt : null;

        if (!canClaimDaily(lastClaim)) {
          const nextClaimTime = lastClaim
            ? new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
            : new Date();

          return reply.status(429).send({
            error: 'Daily reward already claimed',
            nextClaimAt: nextClaimTime.toISOString(),
          });
        }

        // Calculate reward amount
        const rewardAmount = calculateDailyReward({
          id: user.id,
          isPremium: user.isPremium,
        });

        // Insert reward record
        const newRewards = await db
          .insert(rewards)
          .values({
            userId,
            type: 'daily_login',
            amount: rewardAmount,
            metadata: { isPremium: user.isPremium },
          })
          .returning();

        const reward = newRewards[0]!;

        // Add coins to user
        await db
          .update(users)
          .set({
            coins: sql`${users.coins} + ${rewardAmount}`,
          })
          .where(eq(users.id, userId));

        logger.info(
          { userId, amount: rewardAmount },
          'Daily reward claimed',
        );

        return reply.send({
          success: true,
          reward: {
            id: reward.id,
            type: reward.type,
            amount: reward.amount,
            createdAt: reward.createdAt.toISOString(),
          },
          newBalance: user.coins + rewardAmount,
        });
      } catch (err) {
        logger.error({ err }, 'Error claiming daily reward');
        return reply.status(500).send({ error: 'Failed to claim daily reward' });
      }
    },
  );

  /**
   * GET /api/rewards/history
   *
   * Paginated reward history for the authenticated user.
   */
  fastify.get(
    '/api/rewards/history',
    {
      preHandler: [
        verifyAuth,
        validateQuery(rewardHistoryQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const query = request.query as z.infer<typeof rewardHistoryQuerySchema>;
        const limit = query.limit ?? 20;

        const conditions = [eq(rewards.userId, userId)];

        // Cursor-based pagination using created_at
        if (query.cursor) {
          const cursorDate = new Date(query.cursor);
          if (!isNaN(cursorDate.getTime())) {
            conditions.push(
              sql`${rewards.createdAt} < ${cursorDate}`,
            );
          }
        }

        const rewardHistory = await db
          .select({
            id: rewards.id,
            type: rewards.type,
            amount: rewards.amount,
            metadata: rewards.metadata,
            createdAt: rewards.createdAt,
          })
          .from(rewards)
          .where(and(...conditions))
          .orderBy(desc(rewards.createdAt))
          .limit(limit + 1);

        const hasMore = rewardHistory.length > limit;
        const pageItems = hasMore
          ? rewardHistory.slice(0, limit)
          : rewardHistory;

        let nextCursor: string | null = null;
        if (hasMore && pageItems.length > 0) {
          nextCursor = pageItems[pageItems.length - 1]!.createdAt.toISOString();
        }

        const result = pageItems.map((reward) => ({
          id: reward.id,
          type: reward.type,
          amount: reward.amount,
          metadata: reward.metadata,
          createdAt: reward.createdAt.toISOString(),
        }));

        return reply.send({
          rewards: result,
          nextCursor,
          hasMore,
        });
      } catch (err) {
        logger.error({ err }, 'Error fetching reward history');
        return reply.status(500).send({ error: 'Failed to fetch reward history' });
      }
    },
  );
}
