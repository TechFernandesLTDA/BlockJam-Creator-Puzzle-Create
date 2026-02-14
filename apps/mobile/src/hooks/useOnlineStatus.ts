import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseOnlineStatusResult {
  /** Whether the device currently has an active network connection. */
  isOnline: boolean;
  /** True while the initial connectivity check is still in-flight. */
  isChecking: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Reports the device's network connectivity status.
 *
 * Attempts to use `@react-native-community/netinfo` for real-time updates.
 * If the package is not installed (or fails to load) the hook optimistically
 * assumes the device is online, which is a safe default for the UI – API
 * calls will still surface their own network errors independently.
 */
export function useOnlineStatus(): UseOnlineStatusResult {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init(): Promise<void> {
      try {
        // Dynamic import so the hook does not hard-crash when the native
        // module is unavailable (e.g. Expo Go without the config plugin).
        const NetInfo = await import('@react-native-community/netinfo');
        const netInfoModule = NetInfo.default ?? NetInfo;

        // Fetch the current state once.
        try {
          const state = await netInfoModule.fetch();
          setIsOnline(state.isConnected ?? true);
        } catch {
          // Assume online if the fetch itself fails.
          setIsOnline(true);
        }

        setIsChecking(false);

        // Subscribe to changes.
        unsubscribe = netInfoModule.addEventListener((state: { isConnected: boolean | null }) => {
          setIsOnline(state.isConnected ?? true);
        });
      } catch {
        // NetInfo is not available – fall back to "online".
        setIsOnline(true);
        setIsChecking(false);
      }
    }

    init();

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {
          // Swallow cleanup errors.
        }
      }
    };
  }, []);

  return { isOnline, isChecking };
}
