import type { AuthSession } from '@/types';
import { STORAGE_KEYS, readJson } from '@/utils/storage';

/**
 * The signed-in session (user + token) is cached under the NutriCart namespace so
 * a page refresh keeps you signed in. Logging out clears only this cache — it never
 * touches the account or any person profile.
 */
export function readCachedSession(): AuthSession | null {
  return readJson<AuthSession | null>(STORAGE_KEYS.session, null);
}

export function cacheSession(session: AuthSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } catch {
    // ignore storage failures (private mode / quota)
  }
}

export function clearCachedSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    // ignore storage failures
  }
}
