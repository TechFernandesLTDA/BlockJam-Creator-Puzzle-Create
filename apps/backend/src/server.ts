import { buildApp } from './app.js';
import { logger } from './utils/logger.js';
import { closeDb } from './db/client.js';
import { connectRedis, disconnectRedis } from './utils/redis.js';
import { scheduleRankingUpdates } from './jobs/rankingUpdater.js';
import { scheduleRewardDistribution } from './jobs/rewardDistributor.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start(): Promise<void> {
  const app = await buildApp();

  // Connect Redis (non-fatal if unavailable)
  await connectRedis();

  // Schedule background jobs
  await scheduleRankingUpdates();
  await scheduleRewardDistribution();

  try {
    await app.listen({ port: PORT, host: HOST });
    logger.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  // --- Graceful shutdown ---

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal');

    try {
      await app.close();
      logger.info('Fastify server closed');

      await disconnectRedis();
      logger.info('Redis disconnected');

      await closeDb();
      logger.info('Database connection closed');

      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    void shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    void shutdown('unhandledRejection');
  });
}

start().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
