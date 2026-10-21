/**
 * Safe client-side authorization token management.
 * Stores only short-lived bearer JWTs, avoiding plain passwords.
 */

const TOKEN_KEY = 'skillswap_auth_token';
const REFRESH_TOKEN_KEY = 'skillswap_refresh_token';

let memoryToken: string | null = null;

export const tokenStorage = {
  getToken(): string | null {
    if (memoryToken) return memoryToken;
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      memoryToken = stored;
      return stored;
    } catch {
      return null;
    }
  },

  setToken(token: string, refreshToken?: string): void {
    memoryToken = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (e) {
      console.warn('Failed to persist token to storage:', e);
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  clear(): void {
    memoryToken = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to clear tokens from storage:', e);
    }
  },
};
