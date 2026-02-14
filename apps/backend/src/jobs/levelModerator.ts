import { Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { levels } from '../db/schema.js';
import { logger } from '../utils/logger.js';

const QUEUE_NAME = 'level-moderator';

const redisConnection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
};

/** Words that are not allowed in level names */
const BLOCKED_WORDS = [
  'fuck',
  'shit',
  'ass',
  'damn',
  'bitch',
  'dick',
  'porn',
  'sex',
  'nazi',
  'kill',
  'hate',
  'racist',
];

interface ModerationData {
  levelId: string;
}

/**
 * BullMQ queue for auto-moderating newly created levels.
 */
export const moderationQueue = new Queue<ModerationData>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

/**
 * Checks if a level name contains any blocked words.
 */
function containsBlockedWord(name: string): boolean {
  const lower = name.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

/**
 * Checks if a level has an empty grid (no cells).
 */
function isEmptyLevel(levelData: unknown): boolean {
  if (!levelData || typeof levelData !== 'object') {
    return true;
  }

  const data = levelData as Record<string, unknown>;
  const grid = data.grid as Record<string, unknown> | undefined;

  if (!grid || typeof grid !== 'object') {
    return true;
  }

  const cells = grid.cells;
  if (!Array.isArray(cells) || cells.length === 0) {
    return true;
  }

  return false;
}

/**
 * Worker that auto-moderates new levels by checking for
 * inappropriate names and empty level data.
 */
export const moderationWorker = new Worker<ModerationData>(
  QUEUE_NAME,
  async (job) => {
    const { levelId } = job.data;

    logger.info({ levelId }, 'Moderating level');

    const levelResult = await db
      .select({
        id: levels.id,
        name: levels.name,
        levelData: levels.levelData,
        isActive: levels.isActive,
      })
      .from(levels)
      .where(eq(levels.id, levelId))
      .limit(1);

    if (levelResult.length === 0) {
      logger.warn({ levelId }, 'Level not found for moderation');
      return { levelId, action: 'skipped', reason: 'not_found' };
    }

    const level = levelResult[0]!;

    // Check for inappropriate name
    if (containsBlockedWord(level.name)) {
      await db
        .update(levels)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(levels.id, levelId));

      logger.warn(
        { levelId, name: level.name },
        'Level deactivated: inappropriate name',
      );

      return { levelId, action: 'deactivated', reason: 'inappropriate_name' };
    }

    // Check for empty level
    if (isEmptyLevel(level.levelData)) {
      await db
        .update(levels)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(levels.id, levelId));

      logger.warn({ levelId }, 'Level deactivated: empty grid');

      return { levelId, action: 'deactivated', reason: 'empty_level' };
    }

    logger.info({ levelId }, 'Level passed moderation');

    return { levelId, action: 'approved', reason: 'passed' };
  },
  { connection: redisConnection, concurrency: 5 },
);

moderationWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, err },
    'Level moderation job failed',
  );
});

moderationWorker.on('completed', (job, result) => {
  logger.info(
    { jobId: job.id, result },
    'Level moderation job completed',
  );
});

/**
 * Enqueue a level for moderation.
 */
export async function queueLevelModeration(levelId: string): Promise<void> {
  await moderationQueue.add('moderate-level', { levelId });
  logger.info({ levelId }, 'Level queued for moderation');
}
