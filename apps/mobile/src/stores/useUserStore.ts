import { create } from 'zustand';
import type { User } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserStoreState {
  /** The currently-authenticated user, or `null` when signed out. */
  user: User | null;
  /** Convenience flag derived from `user !== null`. */
  isAuthenticated: boolean;
  /** True while an auth/profile request is in-flight. */
  isLoading: boolean;
  /** Local coin balance (kept in sync with the server's `user.coins`). */
  coins: number;
  /** Whether the user has purchased the premium / ad-free upgrade. */
  isPremium: boolean;
}

interface UserStoreActions {
  /**
   * Persist the signed-in user and hydrate related fields (coins, premium).
   */
  setUser: (user: User) => void;

  /** Clear all user-related state on sign-out. */
  logout: () => void;

  /** Credit coins (e.g. rewarded ad, daily bonus). */
  addCoins: (amount: number) => void;

  /**
   * Debit coins. Returns silently if the user has insufficient balance
   * (caller should check beforehand).
   */
  spendCoins: (amount: number) => void;

  /** Toggle the loading flag. */
  setLoading: (isLoading: boolean) => void;

  /** Update the premium status (e.g. after a successful IAP). */
  setPremium: (isPremium: boolean) => void;
}

type UserStore = UserStoreState & UserStoreActions;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialState: UserStoreState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  coins: 0,
  isPremium: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserStore = create<UserStore>((set, get) => ({
  ...initialState,

  // -- Actions ---------------------------------------------------------------

  setUser: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      coins: user.coins,
      isPremium: user.isPremium,
    });
  },

  logout: () => {
    set({ ...initialState });
  },

  addCoins: (amount: number) => {
    if (amount <= 0) return;

    const { coins, user } = get();
    const newBalance = coins + amount;

    set({
      coins: newBalance,
      user: user ? { ...user, coins: newBalance } : null,
    });
  },

  spendCoins: (amount: number) => {
    if (amount <= 0) return;

    const { coins, user } = get();
    if (coins < amount) return;

    const newBalance = coins - amount;

    set({
      coins: newBalance,
      user: user ? { ...user, coins: newBalance } : null,
    });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setPremium: (isPremium: boolean) => {
    const { user } = get();

    set({
      isPremium,
      user: user ? { ...user, isPremium } : null,
    });
  },
}));
