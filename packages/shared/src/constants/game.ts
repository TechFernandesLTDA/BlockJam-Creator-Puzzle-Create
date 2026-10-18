export const GRID_SIZES = [6, 8, 10] as const;

export const DEFAULT_GRID_SIZE = 8;

export const POINTS_PER_CELL = 10;

export const COMBO_MULTIPLIERS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 8,
};

export const MAX_COMBO = 5;

export const PIECES_PER_TURN = 3;

export const INITIAL_COINS = 100;

export const AD_FREQUENCY = 3; // show ad every N community levels played

export const PUBLISH_COST = 0; // coins to publish a level (0 = free, ads shown instead)

export const DAILY_REWARD_COINS = 25;

export const REWARDED_AD_COINS = 15;

export const LEVEL_NAME_MAX_LENGTH = 30;

export const FEED_PAGE_SIZE = 20;
