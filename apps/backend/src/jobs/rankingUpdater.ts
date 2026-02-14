import { Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { levels } from '../db/schema.js';
import { calculateFeedScore } from '../services/feedAlgorithm.js';
import { logger } from '../utils/logger.js';

const QUEUE_NAME = 'ranking-updater';

const redisConnection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
};

/**
 * BullMQ queue for periodic ranking updates.
 */
export const rankingQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

/**
 * Worker that recalculates feed scores for all active levels.
 */
export const rankingWorker = new Worker(
  QUEUE_NAME,
  async (_job) => {
    logger.info('Starting ranking update job');

    const activeLevels = await db
      .select({
        id: levels.id,
        likesCount: levels.likesCount,
        playsCount: levels.playsCount,
        completionRate: levels.completionRate,
        createdAt: levels.createdAt,
      })
      .from(levels)
      .where(eq(levels.isActive, true));

    let updatedCount = 0;

    for (const level of activeLevels) {
      const newScore = calculateFeedScore({
        likesCount: level.likesCount,
        playsCount: level.playsCount,
        completionRate: level.completionRate,
        createdAt: level.createdAt,
      });

      await db
        .update(levels)
        .set({ feedScore: newScore })
        .where(eq(levels.id, level.id));

      updatedCount++;
    }

    logger.info(
      { updatedCount },
      'Ranking update job completed',
    );

    return { updatedCount };
  },
  { connection: redisConnection, concurrency: 1 },
);

rankingWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, err },
    'Ranking update job failed',
  );
});

rankingWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Ranking update job succeeded');
});

/**
 * Schedule the ranking updater to run every 15 minutes.
 */
export async function scheduleRankingUpdates(): Promise<void> {
  // Remove existing repeatable jobs first
  const existingJobs = await rankingQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await rankingQueue.removeRepeatableByKey(job.key);
  }

  await rankingQueue.add(
    'update-rankings',
    {},
    {
      repeat: {
        every: 15 * 60 * 1000, // every 15 minutes
      },
    },
  );

  logger.info('Ranking updater scheduled (every 15 minutes)');
}
