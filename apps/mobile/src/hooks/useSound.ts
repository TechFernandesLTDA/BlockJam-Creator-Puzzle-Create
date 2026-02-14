import { useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSoundResult {
  /** Sound when a block piece is placed onto the grid. */
  playPlace: () => void;
  /** Sound when one or more lines are cleared. */
  playClear: () => void;
  /** Sound when a combo chain continues. */
  playCombo: () => void;
  /** Sound when the game is over (no more valid moves). */
  playGameOver: () => void;
  /** Sound when the player successfully completes a level. */
  playLevelComplete: () => void;
  /** Generic UI click / tap sound. */
  playClick: () => void;
}

// ---------------------------------------------------------------------------
// Placeholder implementation
//
// Logs sound effect triggers to the console during development so they are
// visible in the Metro/debugger output.  Replace the body of each callback
// with actual `react-native-sound` (or Expo Audio) calls when the audio
// assets are ready.
// ---------------------------------------------------------------------------

const TAG = '[Sound]';

function logSound(name: string): void {
  try {
    if (__DEV__) {
      console.log(TAG, name);
    }
  } catch {
    // Never crash for a sound effect.
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides callbacks for playing sound effects throughout the game.
 *
 * Currently a placeholder that logs to the console.  To integrate real
 * audio, load sound files (e.g. via `react-native-sound` or `expo-av`)
 * inside a `useEffect` and trigger playback from each callback.
 */
export function useSound(): UseSoundResult {
  const playPlace = useCallback(() => {
    logSound('place');
  }, []);

  const playClear = useCallback(() => {
    logSound('clear');
  }, []);

  const playCombo = useCallback(() => {
    logSound('combo');
  }, []);

  const playGameOver = useCallback(() => {
    logSound('game_over');
  }, []);

  const playLevelComplete = useCallback(() => {
    logSound('level_complete');
  }, []);

  const playClick = useCallback(() => {
    logSound('click');
  }, []);

  return {
    playPlace,
    playClear,
    playCombo,
    playGameOver,
    playLevelComplete,
    playClick,
  };
}
