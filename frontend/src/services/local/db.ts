import type {
  Address,
  AppNotification,
  AuthSession,
  Budget,
  CartLine,
  MealPlan,
  Order,
  PantryItem,
  PersonProfile,
  User,
  UserPreferences,
  WishlistItem,
} from '@/types';
import { STORAGE_KEYS, clearNamespace, readJson, removeKey, writeJson } from '@/utils/storage';
import { AppError } from '@/utils/errors';
import { DEFAULT_PREFERENCES } from '../contracts';

/**
 * ---------------------------------------------------------------------------
 * Browser persistence for NutriCart (the `local` data mode).
 * ---------------------------------------------------------------------------
 * This is a real small database, not a mock: every collection is stored under
 * `nutricart.v1.<userId>.<collection>` and every write is persisted immediately,
 * so data survives refreshes exactly like it does in MySQL.
 *
 * Passwords are salted and hashed with SHA-256 through Web Crypto. In the Spring
 * Boot backend the same credentials are hashed with BCrypt — plaintext passwords
 * are never stored in either implementation.
 */
export interface LocalUserRecord extends User {
  passwordSalt: string;
  passwordHash: string;
}

export type CollectionName =
  | 'profiles'
  | 'addresses'
  | 'cart'
  | 'wishlist'
  | 'orders'
  | 'pantry'
  | 'mealPlans'
  | 'budgets'
  | 'notifications'
  | 'preferences';

interface CartRecord {
  lines: CartLine[];
}

const NAMESPACE = 'nutricart.v1.';

function collectionKey(userId: number, collection: CollectionName): string {
  return `${NAMESPACE}${userId}.${collection}`;
}

export class LocalDatabase {
  /* ------------------------------------------------------------ accounts -- */

  users(): LocalUserRecord[] {
    return readJson<LocalUserRecord[]>(STORAGE_KEYS.users, []);
  }

  saveUsers(users: LocalUserRecord[]): void {
    writeJson(STORAGE_KEYS.users, users);
  }

  findUserByEmail(email: string): LocalUserRecord | undefined {
    const normalised = email.trim().toLowerCase();
    return this.users().find((user) => user.email.toLowerCase() === normalised);
  }

  nextUserId(): number {
    const users = this.users();
    return users.length === 0 ? 1 : Math.max(...users.map((user) => user.id)) + 1;
  }

  /* ------------------------------------------------------------- session -- */

  session(): AuthSession | null {
    return readJson<AuthSession | null>(STORAGE_KEYS.session, null);
  }

  setSession(session: AuthSession): void {
    writeJson(STORAGE_KEYS.session, session);
  }

  clearSession(): void {
    removeKey(STORAGE_KEYS.session);
  }

  /* --------------------------------------------------------- collections -- */

  list<T>(userId: number, collection: CollectionName, fallback: T[] = []): T[] {
    return readJson<T[]>(collectionKey(userId, collection), fallback);
  }

  save<T>(userId: number, collection: CollectionName, rows: T[]): void {
    writeJson(collectionKey(userId, collection), rows);
  }

  nextId<T extends { id: number }>(rows: T[]): number {
    return rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1;
  }

  /* ------------------------------------------------------ typed accessors -- */

  profiles(userId: number): PersonProfile[] {
    return this.list<PersonProfile>(userId, 'profiles');
  }

  addresses(userId: number): Address[] {
    return this.list<Address>(userId, 'addresses');
  }

  cart(userId: number): CartLine[] {
    return this.list<CartRecord>(userId, 'cart', [{ lines: [] }])[0]?.lines ?? [];
  }

  saveCart(userId: number, lines: CartLine[]): CartLine[] {
    this.save<CartRecord>(userId, 'cart', [{ lines }]);
    return lines;
  }

  wishlist(userId: number): WishlistItem[] {
    return this.list<WishlistItem>(userId, 'wishlist');
  }

  orders(userId: number): Order[] {
    return this.list<Order>(userId, 'orders');
  }

  pantry(userId: number): PantryItem[] {
    return this.list<PantryItem>(userId, 'pantry');
  }

  mealPlans(userId: number): MealPlan[] {
    return this.list<MealPlan>(userId, 'mealPlans');
  }

  budgets(userId: number): Budget[] {
    return this.list<Budget>(userId, 'budgets');
  }

  notifications(userId: number): AppNotification[] {
    return this.list<AppNotification>(userId, 'notifications');
  }

  preferences(userId: number): UserPreferences {
    const rows = this.list<UserPreferences>(userId, 'preferences');
    return { ...DEFAULT_PREFERENCES, ...(rows[0] ?? {}) };
  }

  savePreferences(userId: number, preferences: UserPreferences): UserPreferences {
    this.save<UserPreferences>(userId, 'preferences', [preferences]);
    return preferences;
  }

  /** Requires a signed-in account; every local service call is user scoped. */
  requireUser(): LocalUserRecord {
    const session = this.session();
    if (!session) throw new AppError('Please sign in to continue.', { status: 401 });
    const user = this.users().find((row) => row.id === session.user.id);
    if (!user) {
      this.clearSession();
      throw new AppError('Your session has expired. Please sign in again.', { status: 401 });
    }
    return user;
  }

  reset(): void {
    clearNamespace();
  }
}

/* ----------------------------------------------------------- password ---- */

async function digest(value: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  // Extremely defensive fallback for non-secure contexts.
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash).toString(16)}`;
}

export function makeSalt(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return digest(`${salt}::${password}`);
}
