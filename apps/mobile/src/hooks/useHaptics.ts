import { useCallback } from 'react';
import { Vibration, Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseHapticsResult {
  /** A subtle tap – e.g. placing a block on the grid. */
  lightImpact: () => void;
  /** A moderate tap – e.g. selecting a piece. */
  mediumImpact: () => void;
  /** A strong tap – e.g. game over / error. */
  heavyImpact: () => void;
  /** A very short tick – e.g. scrolling through a picker. */
  selectionChanged: () => void;
  /** A success pattern – e.g. level completed. */
  notificationSuccess: () => void;
  /** An error pattern – e.g. invalid move. */
  notificationError: () => void;
}

// ---------------------------------------------------------------------------
// Vibration patterns (in milliseconds)
//
// Android `Vibration.vibrate` accepts either a duration (ms) or a pattern
// array [wait, vibrate, wait, vibrate, ...].
// iOS ignores durations longer than ~25 ms and treats everything as a
// single-tap; patterns give a rough approximation until expo-haptics or
// react-native-haptic-feedback is integrated.
// ---------------------------------------------------------------------------

const LIGHT_DURATION = 10;
const MEDIUM_DURATION = 20;
const HEAVY_DURATION = 40;
const SELECTION_DURATION = 5;
const SUCCESS_PATTERN = [0, 10, 60, 10]; // two short taps
const ERROR_PATTERN = [0, 40, 80, 40, 80, 40]; // three pulses

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function vibrate(durationOrPattern: number | number[]): void {
  try {
    Vibration.vibrate(durationOrPattern);
  } catch {
    // Vibration may not be available on all devices / simulators.
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides haptic feedback helpers that wrap `react-native` `Vibration`
 * with predefined patterns.
 *
 * Each callback is wrapped in a try/catch so it is always safe to call,
 * even on devices or emulators that do not support vibration.
 *
 * Swap out the implementations for `expo-haptics` or
 * `react-native-haptic-feedback` for richer platform-native haptics.
 */
export function useHaptics(): UseHapticsResult {
  const lightImpact = useCallback(() => {
    vibrate(LIGHT_DURATION);
  }, []);

  const mediumImpact = useCallback(() => {
    vibrate(MEDIUM_DURATION);
  }, []);

  const heavyImpact = useCallback(() => {
    vibrate(HEAVY_DURATION);
  }, []);

  const selectionChanged = useCallback(() => {
    vibrate(SELECTION_DURATION);
  }, []);

  const notificationSuccess = useCallback(() => {
    vibrate(SUCCESS_PATTERN);
  }, []);

  const notificationError = useCallback(() => {
    vibrate(ERROR_PATTERN);
  }, []);

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    selectionChanged,
    notificationSuccess,
    notificationError,
  };
}
