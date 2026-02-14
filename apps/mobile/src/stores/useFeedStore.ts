import { create } from 'zustand';
import type { LevelSummary, FeedSort } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedStoreState {
  /** The currently-loaded page(s) of level summaries. */
  levels: LevelSummary[];
  /** Opaque cursor returned by the API for pagination. */
  cursor: string | null;
  /** Whether additional pages are available. */
  hasMore: boolean;
  /** True while a feed request is in-flight. */
  isLoading: boolean;
  /** Active sort order for the feed. */
  sort: FeedSort;
}

interface FeedStoreActions {
  /** Replace the entire levels list (e.g. on initial load or sort change). */
  setLevels: (levels: LevelSummary[]) => void;

  /**
   * Append a new page of levels returned by the API.
   * @param levels  - The new batch of level summaries.
   * @param cursor  - The cursor for the *next* page, or `null` if exhausted.
   * @param hasMore - Whether more pages remain.
   */
  appendLevels: (
    levels: LevelSummary[],
    cursor: string | null,
    hasMore: boolean,
  ) => void;

  /** Change the sort order. Clears existing levels so the caller can refetch. */
  setSort: (sort: FeedSort) => void;

  /**
   * Optimistically toggle the like state of a level in the local list.
   * Adjusts `likesCount` accordingly (+1 / -1).
   */
  toggleLike: (levelId: string) => void;

  /** Toggle the loading flag. */
  setLoading: (isLoading: boolean) => void;

  /** Reset the feed to its initial blank state. */
  reset: () => void;
}

type FeedStore = FeedStoreState & FeedStoreActions;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialState: FeedStoreState = {
  levels: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  sort: 'trending',
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFeedStore = create<FeedStore>((set, get) => ({
  ...initialState,

  // -- Actions ---------------------------------------------------------------

  setLevels: (levels: LevelSummary[]) => {
    set({ levels, cursor: null, hasMore: true });
  },

  appendLevels: (
    levels: LevelSummary[],
    cursor: string | null,
    hasMore: boolean,
  ) => {
    const existing = get().levels;
    // Deduplicate in case the same page is appended twice (network retry, etc.)
    const existingIds = new Set(existing.map((l) => l.id));
    const unique = levels.filter((l) => !existingIds.has(l.id));

    set({
      levels: [...existing, ...unique],
      cursor,
      hasMore,
    });
  },

  setSort: (sort: FeedSort) => {
    set({
      sort,
      levels: [],
      cursor: null,
      hasMore: true,
    });
  },

  toggleLike: (levelId: string) => {
    const levels = get().levels.map((level) => {
      if (level.id !== levelId) return level;

      const isLiked = !level.isLiked;
      return {
        ...level,
        isLiked,
        likesCount: level.likesCount + (isLiked ? 1 : -1),
      };
    });

    set({ levels });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  reset: () => {
    set({ ...initialState });
  },
}));
