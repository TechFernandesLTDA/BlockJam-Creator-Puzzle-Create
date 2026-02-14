/**
 * Feed ranking algorithm for BlockJam Creator levels.
 *
 * feedScore = (likes * 3) + (plays * 1) + (completionRate * 0.5) + recencyBoost + qualityBonus
 * recencyBoost = max(0, 100 - hoursOld * 2)
 * qualityBonus = (completionRate > 30 && completionRate < 90) ? 50 : 0
 */

export interface FeedScoreInput {
  likesCount: number;
  playsCount: number;
  completionRate: number;
  createdAt: Date;
}

/**
 * Calculates the recency boost based on how recently the level was created.
 * Newer levels get higher boosts, decaying over ~50 hours to zero.
 */
export function calculateRecencyBoost(createdAt: Date): number {
  const now = Date.now();
  const hoursOld = (now - createdAt.getTime()) / (1000 * 60 * 60);
  return Math.max(0, 100 - hoursOld * 2);
}

/**
 * Quality bonus rewards levels with a "healthy" completion rate.
 * Too-easy (>90%) or too-hard (<30%) levels receive no bonus.
 */
export function calculateQualityBonus(completionRate: number): number {
  return completionRate > 30 && completionRate < 90 ? 50 : 0;
}

/**
 * Calculates the overall feed score for a level, used to rank levels
 * in the trending feed.
 */
export function calculateFeedScore(level: FeedScoreInput): number {
  const likesScore = level.likesCount * 3;
  const playsScore = level.playsCount * 1;
  const completionScore = level.completionRate * 0.5;
  const recencyBoost = calculateRecencyBoost(level.createdAt);
  const qualityBonus = calculateQualityBonus(level.completionRate);

  return likesScore + playsScore + completionScore + recencyBoost + qualityBonus;
}
