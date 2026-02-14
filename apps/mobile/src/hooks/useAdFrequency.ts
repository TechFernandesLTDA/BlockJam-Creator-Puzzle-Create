import { useCallback, useMemo } from 'react';

import { useAdsStore } from '../stores/useAdsStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAdFrequencyResult {
  /** Whether an interstitial ad should be shown right now. */
  shouldShowAd: boolean;
  /** Call after the player finishes a level to increment the play counter. */
  markPlayed: () => void;
  /** Call after an interstitial has been displayed to reset the counter. */
  markAdShown: () => void;
  /** Whether the user has purchased the "remove ads" IAP. */
  adsRemoved: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the cadence of interstitial ads.
 *
 * The hook reads from `useAdsStore` and exposes a minimal surface for
 * components to decide when to trigger an interstitial and to report back
 * once it has been shown.
 *
 * Usage:
 * ```ts
 * const { shouldShowAd, markPlayed, markAdShown } = useAdFrequency();
 *
 * // After completing a level:
 * markPlayed();
 * if (shouldShowAd) {
 *   await showInterstitial();
 *   markAdShown();
 * }
 * ```
 */
export function useAdFrequency(): UseAdFrequencyResult {
  const shouldShowInterstitial = useAdsStore(
    (state) => state.shouldShowInterstitial,
  );
  const incrementPlayed = useAdsStore((state) => state.incrementPlayed);
  const markAdShownStore = useAdsStore((state) => state.markAdShown);
  const adsRemoved = useAdsStore((state) => state.adsRemoved);
  const levelsPlayedSinceAd = useAdsStore(
    (state) => state.levelsPlayedSinceAd,
  );

  const shouldShowAd = useMemo(
    () => shouldShowInterstitial(),
    // Re-evaluate whenever the underlying data changes.
    [shouldShowInterstitial, levelsPlayedSinceAd, adsRemoved],
  );

  const markPlayed = useCallback(() => {
    incrementPlayed();
  }, [incrementPlayed]);

  const markAdShown = useCallback(() => {
    markAdShownStore();
  }, [markAdShownStore]);

  return {
    shouldShowAd,
    markPlayed,
    markAdShown,
    adsRemoved,
  };
}
