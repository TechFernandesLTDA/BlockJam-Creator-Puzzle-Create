import { create } from 'zustand';
import { AD_FREQUENCY } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdsStoreState {
  /** Number of community levels the player has completed since the last ad. */
  levelsPlayedSinceAd: number;
  /** Unix-ms timestamp of the last interstitial that was shown. */
  lastAdShown: number;
  /** Whether the user has purchased the "remove ads" IAP. */
  adsRemoved: boolean;
}

interface AdsStoreActions {
  /** Increment the levels-played counter (call after finishing a level). */
  incrementPlayed: () => void;

  /**
   * Determine whether an interstitial ad should be shown right now.
   * Returns `true` every `AD_FREQUENCY` (3) levels, unless ads have been
   * removed via IAP.
   */
  shouldShowInterstitial: () => boolean;

  /** Record that an ad was just displayed (resets counter + updates timestamp). */
  markAdShown: () => void;

  /** Persist the "ads removed" flag (e.g. after a successful IAP). */
  setAdsRemoved: (adsRemoved: boolean) => void;
}

type AdsStore = AdsStoreState & AdsStoreActions;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initialState: AdsStoreState = {
  levelsPlayedSinceAd: 0,
  lastAdShown: 0,
  adsRemoved: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAdsStore = create<AdsStore>((set, get) => ({
  ...initialState,

  // -- Actions ---------------------------------------------------------------

  incrementPlayed: () => {
    set((state) => ({
      levelsPlayedSinceAd: state.levelsPlayedSinceAd + 1,
    }));
  },

  shouldShowInterstitial: () => {
    const { adsRemoved, levelsPlayedSinceAd } = get();
    if (adsRemoved) return false;

    return levelsPlayedSinceAd >= AD_FREQUENCY;
  },

  markAdShown: () => {
    set({
      levelsPlayedSinceAd: 0,
      lastAdShown: Date.now(),
    });
  },

  setAdsRemoved: (adsRemoved: boolean) => {
    set({ adsRemoved });
  },
}));
