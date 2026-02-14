import type { RateLimitPluginOptions } from '@fastify/rate-limit';

export const authRateLimit: Partial<RateLimitPluginOptions> = {
  max: 5,
  timeWindow: '1 minute',
};

export const feedRateLimit: Partial<RateLimitPluginOptions> = {
  max: 30,
  timeWindow: '1 minute',
};

export const levelsRateLimit: Partial<RateLimitPluginOptions> = {
  max: 10,
  timeWindow: '1 minute',
};

export const defaultRateLimit: Partial<RateLimitPluginOptions> = {
  max: 60,
  timeWindow: '1 minute',
};
