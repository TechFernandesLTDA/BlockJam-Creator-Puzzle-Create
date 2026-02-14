import type { Difficulty } from './game';
import type { LevelSummary } from './level';

export type FeedSort = 'trending' | 'new' | 'top';

export interface FeedRequest {
  cursor?: string;
  limit?: number;
  sort?: FeedSort;
  difficulty?: Difficulty;
}

export interface FeedResponse {
  levels: LevelSummary[];
  nextCursor: string | null;
  hasMore: boolean;
}
