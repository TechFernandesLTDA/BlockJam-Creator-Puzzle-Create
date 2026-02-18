import type { User } from '@blockjam/shared';

import api from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { getStorage } from '../utils/storage';

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
