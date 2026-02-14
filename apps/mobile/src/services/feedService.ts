import type { FeedResponse, FeedSort, LevelSummary } from '@blockjam/shared';

import api from './api';

// ---------------------------------------------------------------------------
// Feed API service
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated feed of community levels.
 *
 * @param sort   - The sort order (trending, new, top).
 * @param cursor - Opaque pagination cursor returned by a previous request.
 * @param limit  - Number of items to return (defaults to server default).
 */
export async function getFeed(
  sort: FeedSort,
  cursor?: string,
  limit?: number,
): Promise<FeedResponse> {
  try {
    const params: Record<string, string | number> = { sort };

    if (cursor) {
      params.cursor = cursor;
    }
    if (limit !== undefined) {
      params.limit = limit;
    }

    const response = await api.get<FeedResponse>('/feed', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch the curated list of featured levels shown on the home screen.
 */
export async function getFeatured(): Promise<LevelSummary[]> {
  try {
    const response = await api.get<LevelSummary[]>('/feed/featured');
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Like a level.
 */
export async function likeLevel(levelId: string): Promise<void> {
  try {
    await api.post(`/likes/${levelId}`);
  } catch (error) {
    throw error;
  }
}

/**
 * Remove a like from a level.
 */
export async function unlikeLevel(levelId: string): Promise<void> {
  try {
    await api.delete(`/likes/${levelId}`);
  } catch (error) {
    throw error;
  }
}
