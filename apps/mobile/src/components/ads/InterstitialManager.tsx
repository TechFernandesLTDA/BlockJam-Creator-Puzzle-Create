/**
 * InterstitialManager
 *
 * Placeholder module for managing interstitial ads.
 * All functions currently log to the console and return resolved promises.
 * Replace with react-native-google-mobile-ads integration when ready.
 */

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _isReady = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pre-load an interstitial ad so it is ready to show immediately.
 * In production this will call `InterstitialAd.load()`.
 */
export function loadInterstitial(): void {
  console.log('[InterstitialManager] loadInterstitial called (placeholder)');
  _isReady = true;
}

/**
 * Show a previously loaded interstitial ad.
 * Resolves `true` if the ad was displayed, `false` otherwise.
 */
export function showInterstitial(): Promise<boolean> {
  console.log('[InterstitialManager] showInterstitial called (placeholder)');

  if (!_isReady) {
    console.warn('[InterstitialManager] No interstitial loaded.');
    return Promise.resolve(false);
  }

  // Simulate showing and then mark as consumed.
  _isReady = false;
  return Promise.resolve(true);
}

/**
 * Returns whether an interstitial ad has been loaded and is ready to display.
 */
export function isInterstitialReady(): boolean {
  return _isReady;
}
