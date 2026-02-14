import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

import { API_URL } from '../utils/constants';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor – attach Bearer token when available
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Lazy-import to avoid circular dependencies – authService stores/retrieves
      // the token using MMKV (or the in-memory fallback).
      const { getToken } = await import('./authService');
      const token = getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // If token retrieval fails we simply proceed without auth.
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor – handle 401 (force logout) & network errors
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // ------ 401 Unauthorized → force logout ------
    if (error.response?.status === 401) {
      try {
        const { clearToken } = await import('./authService');
        clearToken();

        // Also reset the user store so the UI reflects the signed-out state.
        const { useUserStore } = await import('../stores/useUserStore');
        useUserStore.getState().logout();
      } catch {
        // Best-effort cleanup; swallow errors to avoid masking the original 401.
      }

      return Promise.reject(error);
    }

    // ------ Network / timeout errors ------
    if (!error.response) {
      const networkError = new Error(
        error.message === 'Network Error'
          ? 'Unable to connect to the server. Please check your internet connection.'
          : error.message || 'An unexpected network error occurred.',
      );

      return Promise.reject(networkError);
    }

    // ------ All other errors – pass through ------
    return Promise.reject(error);
  },
);

export default api;
