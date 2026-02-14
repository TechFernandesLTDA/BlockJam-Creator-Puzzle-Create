import { Queue, Worker } from 'bullmq';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, levels, rewards } from '../db/schema.js';
import { calculateCreatorBonus } from '../services/rewardEngine.js';
import { logger } from '../utils/logger.js';

const QUEUE_NAME = 'reward-distributor';

const redisConnection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
};

/**
 * BullMQ queue for distributing daily creator bonuses.
 */
export const rewardQueue = new Queue(QUEUE_NAME, {
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
 * Worker that distributes daily creator bonuses.
 * Awards coins based on level popularity metrics.
 */
export const rewardWorker = new Worker(
  QUEUE_NAME,
  async (_job) => {
    logger.info('Starting daily reward distribution');

    // Get all active, non-official levels with significant activity
    const activeLevels = await db
      .select({
        id: levels.id,
        creatorId: levels.creatorId,
        name: levels.name,
        likesCount: levels.likesCount,
        playsCount: levels.playsCount,
        completionRate: levels.completionRate,
      })
      .from(levels)
      .where(
        and(
          eq(levels.isActive, true),
          eq(levels.isOfficial, false),
          sql`${levels.playsCount} >= 100`,
        ),
      );

    let totalDistributed = 0;
    let creatorsRewarded = 0;

    // Group levels by creator to aggregate bonuses
    const creatorBonuses = new Map<string, number>();

    for (const level of activeLevels) {
      const bonus = calculateCreatorBonus({
        likesCount: level.likesCount,
        playsCount: level.playsCount,
        completionRate: level.completionRate,
      });

      if (bonus > 0) {
        const existing = creatorBonuses.get(level.creatorId) ?? 0;
        creatorBonuses.set(level.creatorId, existing + bonus);
      }
    }

    // Distribute bonuses to each creator
    for (const [creatorId, totalBonus] of creatorBonuses) {
      // Cap daily bonus at 1000 coins
      const cappedBonus = Math.min(totalBonus, 1000);

      // Insert reward record
      await db.insert(rewards).values({
        userId: creatorId,
        type: 'creator_bonus',
        amount: cappedBonus,
        metadata: {
          totalCalculated: totalBonus,
          capped: totalBonus > 1000,
          levelCount: activeLevels.filter((l) => l.creatorId === creatorId)
            .length,
        },
      });

      // Add coins to creator
      await db
        .update(users)
        .set({
          coins: sql`${users.coins} + ${cappedBonus}`,
        })
        .where(eq(users.id, creatorId));

      totalDistributed += cappedBonus;
      creatorsRewarded++;

      logger.info(
        { creatorId, bonus: cappedBonus },
        'Creator bonus distributed',
      );
    }

    logger.info(
      { totalDistributed, creatorsRewarded },
      'Daily reward distribution completed',
    );

    return { totalDistributed, creatorsRewarded };
  },
  { connection: redisConnection, concurrency: 1 },
);

rewardWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, err },
    'Reward distribution job failed',
  );
});

rewardWorker.on('completed', (job, result) => {
  logger.info(
    { jobId: job.id, result },
    'Reward distribution job completed',
  );
});

/**
 * Schedule the reward distributor to run daily at midnight UTC.
 */
export async function scheduleRewardDistribution(): Promise<void> {
  // Remove existing repeatable jobs
  const existingJobs = await rewardQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await rewardQueue.removeRepeatableByKey(job.key);
  }

  await rewardQueue.add(
    'distribute-rewards',
    {},
    {
      repeat: {
        pattern: '0 0 * * *', // midnight UTC daily
      },
    },
  );

  logger.info('Reward distributor scheduled (daily at midnight UTC)');
}
