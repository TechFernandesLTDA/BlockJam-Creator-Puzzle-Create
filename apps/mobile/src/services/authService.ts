import type { User } from '@blockjam/shared';

import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

// ---------------------------------------------------------------------------
// MMKV wrapper with in-memory fallback
// ---------------------------------------------------------------------------

/**
 * Lightweight storage abstraction.
 *
 * Attempts to use `react-native-mmkv` when it is installed and available at
 * runtime.  If the native module is missing (e.g. inside a bare Expo Go
 * build or a test runner) every operation silently falls back to a plain
 * in-memory `Map`, so the rest of the app keeps working.
 */

let mmkvInstance: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
} | null = null;

const memoryStore = new Map<string, string>();

function getStorage() {
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

// ---------------------------------------------------------------------------
// Token persistence
// ---------------------------------------------------------------------------

/**
 * Persist the JWT auth token to MMKV (or the in-memory fallback).
 */
export function saveToken(token: string): void {
  try {
    getStorage().set(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch {
    // Swallow – storage write failure should not crash the app.
  }
}

/**
 * Retrieve the stored JWT auth token, or `undefined` if none is stored.
 */
export function getToken(): string | undefined {
  try {
    return getStorage().getString(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return undefined;
  }
}

/**
 * Remove the stored JWT auth token (e.g. on logout or 401).
 */
export function clearToken(): void {
  try {
    getStorage().delete(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    // Swallow.
  }
}

// ---------------------------------------------------------------------------
// Auth API responses
// ---------------------------------------------------------------------------

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------

/**
 * Exchange a Google ID token for a BlockJam session.
 */
export async function loginWithGoogle(
  idToken: string,
): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/auth/google', {
      idToken,
    });

    const { token } = response.data;
    saveToken(token);

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Authenticate anonymously using a stable device identifier.
 */
export async function loginAsGuest(
  deviceId: string,
): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/auth/guest', {
      deviceId,
    });

    const { token } = response.data;
    saveToken(token);

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Refresh an expired access token using the stored refresh token.
 */
export async function refreshToken(): Promise<RefreshResponse> {
  try {
    const response = await api.post<RefreshResponse>('/auth/refresh');

    const { token } = response.data;
    saveToken(token);

    return response.data;
  } catch (error) {
    throw error;
  }
}
