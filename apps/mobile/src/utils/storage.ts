/**
 * Lightweight MMKV storage abstraction with in-memory fallback.
 *
 * Attempts to use `react-native-mmkv` when available.  If the native module
 * is missing (e.g. inside Expo Go or a test runner), every operation silently
 * falls back to a plain in-memory `Map`.
 */

let mmkvInstance: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
} | null = null;

const memoryStore = new Map<string, string>();

export function getStorage() {
  if (mmkvInstance) return mmkvInstance;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    mmkvInstance = new MMKV();
    return mmkvInstance!;
  } catch {
    // MMKV is not available – use in-memory fallback.
    mmkvInstance = {
      getString: (key: string) => memoryStore.get(key),
      set: (key: string, value: string) => {
        memoryStore.set(key, value);
      },
      delete: (key: string) => {
        memoryStore.delete(key);
      },
    };
    return mmkvInstance;
  }
}
