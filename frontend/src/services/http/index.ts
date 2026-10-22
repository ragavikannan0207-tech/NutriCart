import type {
  Address,
  AddressInput,
  AppNotification,
  AuthSession,
  Budget,
  BudgetPeriod,
  CartLine,
  DayOfWeek,
  LoginPayload,
  MealPlan,
  MealSlot,
  NotificationDraft,
  Order,
  PantryItem,
  PantryItemInput,
  PersonProfile,
  PersonProfileInput,
  RegisterPayload,
  UserPreferences,
  WishlistItem,
} from '@/types';
import {
  type NutriCartBackend,
  type OrderService,
  type PlaceOrderInput,
} from '../contracts';
import { http, setAuthToken } from './client';
import { readCachedSession } from '../session';

/**
 * Spring Boot implementation of every NutriCart service.
 * One method per REST endpoint (see backend/src/main/java/com/nutricart/web/**).
 */
export function createHttpBackend(): NutriCartBackend {
  const auth = {
    session(): AuthSession | null {
      // The session is cached by the state layer when a login succeeds.
      return readCachedSession();
    },

    async register(payload: RegisterPayload): Promise<AuthSession> {
      const session = await http.post<AuthSession>('/auth/register', payload);
      setAuthToken(session.token);
      return session;
    },

    async login(payload: LoginPayload): Promise<AuthSession> {
      const session = await http.post<AuthSession>('/auth/login', payload);
      setAuthToken(session.token);
      return session;
    },

    async logout(): Promise<void> {
      setAuthToken(null);
    },

    async updateAccount(fullName: string): Promise<AuthSession> {
      const session = await http.put<AuthSession>('/users/me', { fullName });
      setAuthToken(session.token);
      return session;
    },
  };

  const profiles = {
    list: () => http.get<PersonProfile[]>('/profiles'),
    create: (input: PersonProfileInput) => http.post<PersonProfile>('/profiles', input),
    update: (id: number, input: PersonProfileInput) => http.put<PersonProfile>(`/profiles/${id}`, input),
    remove: (id: number) => http.delete<void>(`/profiles/${id}`),
    setActive: (id: number) => http.post<PersonProfile[]>(`/profiles/${id}/activate`),
  };

  const addresses = {
    list: () => http.get<Address[]>('/addresses'),
    create: (input: AddressInput) => http.post<Address>('/addresses', input),
    update: (id: number, input: AddressInput) => http.put<Address>(`/addresses/${id}`, input),
    remove: (id: number) => http.delete<void>(`/addresses/${id}`),
    setDefault: (id: number) => http.post<Address[]>(`/addresses/${id}/default`),
  };

  const cart = {
    get: () => http.get<CartLine[]>('/cart'),
    setQuantity: (productId: number, quantity: number) =>
      http.put<CartLine[]>(`/cart/items/${productId}`, { quantity }),
    increment: (productId: number, delta: number) =>
      http.post<CartLine[]>(`/cart/items/${productId}/increment`, { delta }),
    remove: (productId: number) => http.delete<CartLine[]>(`/cart/items/${productId}`),
    clear: () => http.delete<void>('/cart'),
    merge: (lines: Array<{ productId: number; quantity: number }>) => http.post<CartLine[]>('/cart/merge', { lines }),
  };

  const wishlist = {
    list: () => http.get<WishlistItem[]>('/wishlist'),
    add: (productId: number) => http.post<WishlistItem[]>(`/wishlist/${productId}`),
    remove: (productId: number) => http.delete<WishlistItem[]>(`/wishlist/${productId}`),
    toggle: (productId: number) => http.post<WishlistItem[]>(`/wishlist/${productId}/toggle`),
  };

  const orders: OrderService = {
    list: () => http.get<Order[]>('/orders'),
    get: async (id: number) => {
      try {
        return await http.get<Order>(`/orders/${id}`);
      } catch (error) {
        if (typeof error === 'object' && error !== null && (error as { status?: number }).status === 404) return null;
        throw error;
      }
    },
    place: (input: PlaceOrderInput) =>
      http.post<Order>('/orders', {
        personProfileId: input.personProfileId,
        addressId: input.addressId,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        notes: input.notes ?? '',
      }),
    cancel: (id: number) => http.post<Order>(`/orders/${id}/cancel`),
    syncStatuses: () => http.post<Order[]>('/orders/sync'),
  };

  const pantry = {
    list: () => http.get<PantryItem[]>('/pantry'),
    create: (input: PantryItemInput) => http.post<PantryItem>('/pantry', input),
    update: (id: number, input: PantryItemInput) => http.put<PantryItem>(`/pantry/${id}`, input),
    remove: (id: number) => http.delete<void>(`/pantry/${id}`),
    adjust: async (id: number, delta: number) =>
      http.post<{ removed: boolean; items: PantryItem[] }>(`/pantry/${id}/adjust`, { delta }).then((result) => (result.removed ? null : result.items)),
  };

  const mealPlans = {
    getWeek: (weekStart: string) => http.get<MealPlan>(`/meal-plans?weekStart=${encodeURIComponent(weekStart)}`),
    addItem: (day: DayOfWeek, slot: MealSlot, recipeId: number, servings: number, weekStart?: string) =>
      http.post<MealPlan>('/meal-plans/items', { day, slot, recipeId, servings, weekStart }),
    updateItem: (itemId: number, patch: { servings?: number; recipeId?: number; day?: DayOfWeek; slot?: MealSlot }) =>
      http.put<MealPlan>(`/meal-plans/items/${itemId}`, patch),
    removeItem: (itemId: number) => http.delete<MealPlan>(`/meal-plans/items/${itemId}`),
  };

  const budget = {
    get: async (personProfileId: number) => {
      try {
        return await http.get<Budget>(`/budget?personProfileId=${personProfileId}`);
      } catch (error) {
        if (typeof error === 'object' && error !== null && (error as { status?: number }).status === 404) return null;
        throw error;
      }
    },
    save: (personProfileId: number, amount: number, period: BudgetPeriod) =>
      http.put<Budget>('/budget', { personProfileId, amount, period }),
  };

  const notifications = {
    list: () => http.get<AppNotification[]>('/notifications'),
    create: (draft: NotificationDraft) => http.post<AppNotification>('/notifications', draft),
    markRead: (id: number) => http.post<AppNotification[]>(`/notifications/${id}/read`),
    markAllRead: () => http.post<AppNotification[]>('/notifications/read-all'),
    remove: (id: number) => http.delete<AppNotification[]>(`/notifications/${id}`),
  };

  const preferences = {
    get: () => http.get<UserPreferences>('/preferences'),
    save: (next: UserPreferences) => http.put<UserPreferences>('/preferences', next),
  };

  return {
    mode: 'api',
    auth,
    profiles,
    addresses,
    cart,
    wishlist,
    orders,
    pantry,
    mealPlans,
    budget,
    notifications,
    preferences,
  };
}
