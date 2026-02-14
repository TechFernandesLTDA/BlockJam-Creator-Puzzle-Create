import { DAILY_REWARD_COINS } from '@blockjam/shared';

export interface RewardUser {
  id: string;
  isPremium: boolean;
}

export interface RewardLevel {
  likesCount: number;
  playsCount: number;
  completionRate: number;
}

/**
 * Checks whether a user can claim their daily login reward.
 * Requires at least 24 hours since the last claim.
 */
export function canClaimDaily(lastClaim: Date | null): boolean {
  if (!lastClaim) {
    return true;
  }

  const now = Date.now();
  const lastClaimTime = lastClaim.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return now - lastClaimTime >= twentyFourHours;
}

/**
 * Calculates the daily login reward amount for a user.
 * Premium users get double the standard reward.
 */
export function calculateDailyReward(user: RewardUser): number {
  const baseReward = DAILY_REWARD_COINS;
  return user.isPremium ? baseReward * 2 : baseReward;
}

/**
 * Calculates a creator bonus for a level based on its popularity metrics.
 *
 * Bonus tiers:
 * - 100+ plays with 10+ likes: 50 coins
 * - 500+ plays with 50+ likes: 150 coins
 * - 1000+ plays with 100+ likes: 500 coins
 *
 * An additional multiplier is applied for levels with healthy completion rates.
 */
export function calculateCreatorBonus(level: RewardLevel): number {
  let bonus = 0;

  if (level.playsCount >= 1000 && level.likesCount >= 100) {
    bonus = 500;
  } else if (level.playsCount >= 500 && level.likesCount >= 50) {
    bonus = 150;
  } else if (level.playsCount >= 100 && level.likesCount >= 10) {
    bonus = 50;
  }

  // Healthy completion rate multiplier (30-90%)
  if (
    bonus > 0 &&
    level.completionRate > 30 &&
    level.completionRate < 90
  ) {
    bonus = Math.floor(bonus * 1.5);
  }

  return bonus;
}
