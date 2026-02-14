import type { FastifyInstance } from 'fastify';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { levels, users, likes } from '../db/schema.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { feedQuerySchema } from '@blockjam/shared';
import { FEED_PAGE_SIZE } from '@blockjam/shared';
import { logger } from '../utils/logger.js';
import type { z } from 'zod';

export default async function feedRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/feed
   *
   * Main community feed with cursor-based pagination.
   * Supports sorting by trending (feed score), new (created_at), or top (likes_count).
   * Optionally filters by difficulty.
   */
  fastify.get(
    '/api/feed',
    { preHandler: [optionalAuth, validateQuery(feedQuerySchema)] },
    async (request, reply) => {
      try {
        const query = request.query as z.infer<typeof feedQuerySchema>;
        const limit = query.limit ?? FEED_PAGE_SIZE;
        const sort = query.sort ?? 'trending';

        // Build conditions
        const conditions = [
          eq(levels.isActive, true),
          eq(levels.isOfficial, false),
        ];

        if (query.difficulty) {
          conditions.push(eq(levels.difficulty, query.difficulty));
        }

        // Cursor-based pagination
        if (query.cursor) {
          // Cursor format: "value:id" where value is the sort column value
          const cursorParts = query.cursor.split(':');
          if (cursorParts.length === 2) {
            const cursorValue = parseFloat(cursorParts[0]!);
            const cursorId = cursorParts[1]!;

            if (sort === 'trending') {
              conditions.push(
                sql`(${levels.feedScore}, ${levels.id}) < (${cursorValue}, ${cursorId})`,
              );
            } else if (sort === 'new') {
              conditions.push(
                sql`(extract(epoch from ${levels.createdAt}), ${levels.id}) < (${cursorValue}, ${cursorId})`,
              );
            } else if (sort === 'top') {
              conditions.push(
                sql`(${levels.likesCount}, ${levels.id}) < (${cursorValue}, ${cursorId})`,
              );
            }
          }
        }

        // Determine ordering
        let orderBy;
        if (sort === 'new') {
          orderBy = [desc(levels.createdAt), desc(levels.id)];
        } else if (sort === 'top') {
          orderBy = [desc(levels.likesCount), desc(levels.id)];
        } else {
          // trending
          orderBy = [desc(levels.feedScore), desc(levels.id)];
        }

        const feedLevels = await db
          .select({
            id: levels.id,
            name: levels.name,
            creatorId: levels.creatorId,
            creatorName: users.displayName,
            creatorAvatar: users.avatarUrl,
            gridSize: levels.gridSize,
            difficulty: levels.difficulty,
            thumbnailUrl: levels.thumbnailUrl,
            likesCount: levels.likesCount,
            playsCount: levels.playsCount,
            completionRate: levels.completionRate,
            feedScore: levels.feedScore,
            isOfficial: levels.isOfficial,
            isFeatured: levels.isFeatured,
            createdAt: levels.createdAt,
          })
          .from(levels)
          .innerJoin(users, eq(levels.creatorId, users.id))
          .where(and(...conditions))
          .orderBy(...orderBy)
          .limit(limit + 1); // Fetch one extra to determine hasMore

        const hasMore = feedLevels.length > limit;
        const pageItems = hasMore ? feedLevels.slice(0, limit) : feedLevels;

        // Check which levels the user has liked
        const userId = request.user?.id;
        let likedLevelIds = new Set<string>();
        if (userId && pageItems.length > 0) {
          const levelIds = pageItems.map((l) => l.id);
          const userLikes = await db
            .select({ levelId: likes.levelId })
            .from(likes)
            .where(
              and(
                eq(likes.userId, userId),
                sql`${likes.levelId} = ANY(${levelIds})`,
              ),
            );
          likedLevelIds = new Set(userLikes.map((l) => l.levelId));
        }

        // Build next cursor
        let nextCursor: string | null = null;
        if (hasMore && pageItems.length > 0) {
          const lastItem = pageItems[pageItems.length - 1]!;
          if (sort === 'trending') {
            nextCursor = `${lastItem.feedScore}:${lastItem.id}`;
          } else if (sort === 'new') {
            nextCursor = `${lastItem.createdAt.getTime() / 1000}:${lastItem.id}`;
          } else if (sort === 'top') {
            nextCursor = `${lastItem.likesCount}:${lastItem.id}`;
          }
        }

        const result = pageItems.map((level) => ({
          id: level.id,
          name: level.name,
          creatorId: level.creatorId,
          creatorName: level.creatorName,
          creatorAvatar: level.creatorAvatar,
          gridSize: level.gridSize,
          difficulty: level.difficulty,
          thumbnailUrl: level.thumbnailUrl,
          likesCount: level.likesCount,
          playsCount: level.playsCount,
          completionRate: level.completionRate,
          isOfficial: level.isOfficial,
          isFeatured: level.isFeatured,
          isLiked: likedLevelIds.has(level.id),
          createdAt: level.createdAt.toISOString(),
        }));

        return reply.send({
          levels: result,
          nextCursor,
          hasMore,
        });
      } catch (err) {
        logger.error({ err }, 'Error fetching feed');
        return reply.status(500).send({ error: 'Failed to fetch feed' });
      }
    },
  );

  /**
   * GET /api/feed/featured
   *
   * Returns featured levels curated by admins.
   */
  fastify.get(
    '/api/feed/featured',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const featuredLevels = await db
          .select({
            id: levels.id,
            name: levels.name,
            creatorId: levels.creatorId,
            creatorName: users.displayName,
            creatorAvatar: users.avatarUrl,
            gridSize: levels.gridSize,
            difficulty: levels.difficulty,
            thumbnailUrl: levels.thumbnailUrl,
            likesCount: levels.likesCount,
            playsCount: levels.playsCount,
            completionRate: levels.completionRate,
            isOfficial: levels.isOfficial,
            isFeatured: levels.isFeatured,
            createdAt: levels.createdAt,
          })
          .from(levels)
          .innerJoin(users, eq(levels.creatorId, users.id))
          .where(
            and(
              eq(levels.isFeatured, true),
              eq(levels.isActive, true),
            ),
          )
          .orderBy(desc(levels.likesCount))
          .limit(20);

        // Check user likes
        const userId = request.user?.id;
        let likedLevelIds = new Set<string>();
        if (userId && featuredLevels.length > 0) {
          const levelIds = featuredLevels.map((l) => l.id);
          const userLikes = await db
            .select({ levelId: likes.levelId })
            .from(likes)
            .where(
              and(
                eq(likes.userId, userId),
                sql`${likes.levelId} = ANY(${levelIds})`,
              ),
            );
          likedLevelIds = new Set(userLikes.map((l) => l.levelId));
        }

        const result = featuredLevels.map((level) => ({
          id: level.id,
          name: level.name,
          creatorId: level.creatorId,
          creatorName: level.creatorName,
          creatorAvatar: level.creatorAvatar,
          gridSize: level.gridSize,
          difficulty: level.difficulty,
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
        logger.error({ err }, 'Error fetching featured levels');
        return reply.status(500).send({ error: 'Failed to fetch featured levels' });
      }
    },
  );
}
