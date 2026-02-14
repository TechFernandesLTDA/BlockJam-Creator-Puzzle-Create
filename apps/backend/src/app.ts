import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';
import { defaultRateLimit } from './middleware/rateLimit.js';

// Route modules
import authRoutes from './routes/auth.routes.js';
import levelsRoutes from './routes/levels.routes.js';
import feedRoutes from './routes/feed.routes.js';
import likesRoutes from './routes/likes.routes.js';
import usersRoutes from './routes/users.routes.js';
import rewardsRoutes from './routes/rewards.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use our own pino logger
    trustProxy: true,
  });

  // --- Plugins ---

  // CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: defaultRateLimit.max ?? 60,
    timeWindow: (defaultRateLimit.timeWindow as string) ?? '1 minute',
  });

  // --- Health check ---

  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // --- Routes ---

  await app.register(authRoutes);
  await app.register(levelsRoutes);
  await app.register(feedRoutes);
  await app.register(likesRoutes);
  await app.register(usersRoutes);
  await app.register(rewardsRoutes);

  // --- Global error handler ---

  app.setErrorHandler((error, _request, reply) => {
    logger.error({ err: error }, 'Unhandled error');

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
      });
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: error.validation,
      });
    }

    // Rate limit errors
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too many requests. Please try again later.',
      });
    }

    // Default 500
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error:
        statusCode >= 500
          ? 'Internal server error'
          : error.message ?? 'Unknown error',
    });
  });

  // --- Not found handler ---

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      error: 'Route not found',
    });
  });

  return app;
}
