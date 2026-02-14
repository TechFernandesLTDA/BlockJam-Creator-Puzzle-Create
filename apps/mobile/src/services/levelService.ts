import type {
  LevelData,
  LevelSummary,
  FeedRequest,
  FeedResponse,
  Difficulty,
  GridSize,
} from '@blockjam/shared';

import api from './api';

// ---------------------------------------------------------------------------
// Request / Response helpers
// ---------------------------------------------------------------------------

export interface CreateLevelRequest {
  levelData: LevelData;
}

export interface RecordPlayRequest {
  score: number;
  movesUsed: number;
  timeMs: number;
}

export interface CompleteLevelRequest {
  score: number;
  movesUsed: number;
  timeMs: number;
  linesCleared: number;
}

export interface LevelDetailResponse {
  level: LevelSummary;
  data: LevelData;
}

// ---------------------------------------------------------------------------
// Level API service
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated feed of levels using cursor-based pagination.
 */
export async function getLevels(
  params: FeedRequest,
): Promise<FeedResponse> {
  try {
    const response = await api.get<FeedResponse>('/feed', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a single level by its ID, including full level data.
 */
export async function getLevel(id: string): Promise<LevelDetailResponse> {
  try {
    const response = await api.get<LevelDetailResponse>(`/levels/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Create (publish) a new level.
 */
export async function createLevel(
  data: CreateLevelRequest,
): Promise<LevelSummary> {
  try {
    const response = await api.post<LevelSummary>('/levels', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a level that the current user owns.
 */
export async function deleteLevel(id: string): Promise<void> {
  try {
    await api.delete(`/levels/${id}`);
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch the ordered list of official campaign levels.
 */
export async function getCampaignLevels(): Promise<LevelSummary[]> {
  try {
    const response = await api.get<LevelSummary[]>('/levels/campaign');
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Record that the player started/played a level (increments play count).
 */
export async function recordPlay(
  id: string,
  data: RecordPlayRequest,
): Promise<void> {
  try {
    await api.post(`/levels/${id}/play`, data);
  } catch (error) {
    throw error;
  }
}

/**
 * Record that the player completed a level successfully.
 */
export async function completeLevel(
  id: string,
  data: CompleteLevelRequest,
): Promise<void> {
  try {
    await api.post(`/levels/${id}/complete`, data);
  } catch (error) {
    throw error;
  }
}
