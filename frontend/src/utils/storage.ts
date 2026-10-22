/**
 * Fail-safe localStorage wrapper.
 * Every piece of local state lives under the `nutricart.v1.` namespace so it can
 * be inspected or cleared without touching anything else on the origin.
 */

const NAMESPACE = 'nutricart.v1.';

export const STORAGE_KEYS = {
  session: `${NAMESPACE}session`,
  users: `${NAMESPACE}users`,
  db: `${NAMESPACE}db`,
  preferences: `${NAMESPACE}preferences`,
  activeProfile: `${NAMESPACE}activeProfile`,
  cart: `${NAMESPACE}cart`,
  wishlist: `${NAMESPACE}wishlist`,
  orders: `${NAMESPACE}orders`,
  pantry: `${NAMESPACE}pantry`,
  mealPlans: `${NAMESPACE}mealPlans`,
  budgets: `${NAMESPACE}budgets`,
  notifications: `${NAMESPACE}notifications`,
  addresses: `${NAMESPACE}addresses`,
  smartGrocery: `${NAMESPACE}smartGrocery`,
} as const;

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode) — the in-memory state still works.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Clears every NutriCart key (used by Settings → Reset demo data). */
export function clearNamespace(): void {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(NAMESPACE))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function newId(existing: number[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
