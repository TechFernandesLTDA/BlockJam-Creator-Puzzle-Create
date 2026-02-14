// ---------------------------------------------------------------------------
// Analytics service (placeholder)
//
// All methods log to the console for development purposes.
// Replace the implementations with a real analytics SDK (e.g. Firebase
// Analytics, Amplitude, Mixpanel) before shipping to production.
// ---------------------------------------------------------------------------

const TAG = '[Analytics]';

/**
 * Track a generic named event with optional parameters.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  try {
    if (__DEV__) {
      console.log(TAG, 'event', name, params ?? {});
    }
  } catch {
    // Analytics should never crash the app.
  }
}

/**
 * Track a screen view (page impression).
 */
export function trackScreen(screenName: string): void {
  try {
    if (__DEV__) {
      console.log(TAG, 'screen_view', { screenName });
    }
  } catch {
    // Swallow.
  }
}

/**
 * Track a level play event with score and completion info.
 */
export function trackLevelPlay(
  levelId: string,
  score: number,
  completed: boolean,
): void {
  try {
    if (__DEV__) {
      console.log(TAG, 'level_play', { levelId, score, completed });
    }
  } catch {
    // Swallow.
  }
}

/**
 * Track an ad impression.
 */
export function trackAdImpression(
  adType: 'banner' | 'interstitial' | 'rewarded',
): void {
  try {
    if (__DEV__) {
      console.log(TAG, 'ad_impression', { adType });
    }
  } catch {
    // Swallow.
  }
}
