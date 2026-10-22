import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Address,
  AddressInput,
  AppNotification,
  Budget,
  BudgetPeriod,
  CartLine,
  DayOfWeek,
  MealPlan,
  MealSlot,
  NotificationDraft,
  Order,
  PantryItem,
  PantryItemInput,
  PersonProfile,
  PersonProfileInput,
  UserPreferences,
  WishlistItem,
} from '@/types';
import { getProductById } from '@/data/products';
import { priceCart, type PricedCart } from '@/domain/pricing';
import { startOfWeekIso } from '@/domain/pantry';
import { activeOrderOf, sortOrdersNewestFirst } from '@/domain/orders';
import { DEFAULT_PREFERENCES } from '@/services/contracts';
import { friendlyMessage, toAppError } from '@/utils/errors';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface AppDataValue {
  ready: boolean;
  loading: boolean;
  /** True when the signed-in account has no person profile yet. */
  needsProfileSetup: boolean;
  profiles: PersonProfile[];
  activeProfile: PersonProfile | null;
  addresses: Address[];
  defaultAddress: Address | null;
  cart: CartLine[];
  pricedCart: PricedCart;
  cartCount: number;
  wishlist: WishlistItem[];
  wishlistIds: Set<number>;
  orders: Order[];
  currentOrder: Order | undefined;
  pantryItems: PantryItem[];
  mealPlan: MealPlan | null;
  weekStart: string;
  budget: Budget | null;
  notifications: AppNotification[];
  unreadCount: number;
  preferences: UserPreferences;

  createProfile: (input: PersonProfileInput) => Promise<PersonProfile>;
  updateProfile: (id: number, input: PersonProfileInput) => Promise<PersonProfile>;
  deleteProfile: (id: number) => Promise<void>;
  setActiveProfile: (id: number) => Promise<void>;

  createAddress: (input: AddressInput) => Promise<Address>;
  updateAddress: (id: number, input: AddressInput) => Promise<Address>;
  deleteAddress: (id: number) => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;

  setCartQuantity: (productId: number, quantity: number) => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  addManyToCart: (lines: Array<{ productId: number; quantity: number }>) => Promise<number>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;

  toggleWishlist: (productId: number) => Promise<void>;
  addWishlistToCart: (productIds: number[]) => Promise<number>;

  placeOrder: (input: {
    addressId: number;
    paymentMethod: Order['paymentMethod'];
    paymentReference: string;
    notes?: string;
  }) => Promise<Order>;
  cancelOrder: (orderId: number) => Promise<Order>;
  reorder: (order: Order) => Promise<number>;

  createPantryItem: (input: PantryItemInput) => Promise<PantryItem>;
  updatePantryItem: (id: number, input: PantryItemInput) => Promise<PantryItem>;
  deletePantryItem: (id: number) => Promise<void>;
  adjustPantryItem: (id: number, delta: number) => Promise<void>;
  addProductsToPantry: (lines: Array<{ productId: number; quantity: number }>) => Promise<number>;

  loadMealPlanWeek: (weekStart: string) => Promise<void>;
  addMeal: (day: DayOfWeek, slot: MealSlot, recipeId: number, servings: number, weekStart?: string) => Promise<void>;
  updateMeal: (itemId: number, patch: { servings?: number; recipeId?: number }) => Promise<void>;
  removeMeal: (itemId: number) => Promise<void>;

  saveBudget: (amount: number, period: BudgetPeriod) => Promise<void>;
  savePreferences: (next: UserPreferences) => Promise<void>;

  pushNotification: (draft: NotificationDraft) => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  removeNotification: (id: number) => Promise<void>;

  refresh: () => Promise<void>;
  clearAllLocalData: () => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

/**
 * ONE connected application state.
 * Every page reads and mutates the same cart, wishlist, orders, pantry, meal plan,
 * budget and notification collections, so an action in one module is instantly
 * visible everywhere else (Shop → Cart → Checkout → Orders → Budget → Purchased
 * Nutrition → For You).
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { backend, status, user } = useAuth();
  const toast = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<PersonProfile[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [weekStart, setWeekStart] = useState<string>(startOfWeekIso());
  const housekeepingDone = useRef(false);

  const fail = useCallback(
    (error: unknown, fallbackTitle: string): never => {
      const appError = toAppError(error);
      toast.error(fallbackTitle, friendlyMessage(appError));
      throw appError;
    },
    [toast],
  );

  const requireBackend = useCallback(() => {
    if (!backend) throw toAppError(new Error('NutriCart is still starting up.'));
    return backend;
  }, [backend]);

  /** Loads every collection for the signed-in account. */
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!backend || !user) return;
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setLoading(true);
    try {
      const nextProfiles = await backend.profiles.list();
      const [nextAddresses, nextCart, nextWishlist, nextOrders, nextPantry, nextPreferences, nextNotifications] =
        await Promise.all([
          backend.addresses.list(),
          backend.cart.get(),
          backend.wishlist.list(),
          backend.orders.list(),
          backend.pantry.list(),
          backend.preferences.get(),
          backend.notifications.list(),
        ]);

      // Meal plans require an active person profile. Do not call the meal-planning
      // endpoint (or surface its error) before a profile exists — the profile setup
      // page is an intentional empty state at that point.
      const nextPlan = nextProfiles.length > 0 ? await backend.mealPlans.getWeek(startOfWeekIso()) : null;

      setProfiles(nextProfiles);
      setAddresses(nextAddresses);
      setCart(nextCart);
      setWishlist(nextWishlist);
      setOrders(sortOrdersNewestFirst(nextOrders));
      setPantryItems(nextPantry);
      setMealPlan(nextPlan);
      setPreferences(nextPreferences);
      setNotifications(nextNotifications);

      const active = nextProfiles.find((profile) => profile.isActive) ?? nextProfiles[0] ?? null;
      setBudget(active ? await backend.budget.get(active.id) : null);
    } catch (error) {
      toast.error('Could not load your NutriCart data', friendlyMessage(error));
    } finally {
      setLoading(false);
      setReady(true);
      refreshingRef.current = false;
    }
  }, [backend, user, toast]);

  useEffect(() => {
    if (status !== 'authenticated' || !backend) {
      setReady(false);
      housekeepingDone.current = false;
      setProfiles([]);
      setAddresses([]);
      setCart([]);
      setWishlist([]);
      setOrders([]);
      setPantryItems([]);
      setMealPlan(null);
      setBudget(null);
      setNotifications([]);
      return;
    }
    void refresh();
  }, [status, backend, refresh]);

  const activeProfile = useMemo(() => profiles.find((profile) => profile.isActive) ?? profiles[0] ?? null, [profiles]);

  // Re-read the budget whenever the active person changes.
  useEffect(() => {
    if (!backend || !activeProfile) return;
    let cancelled = false;
    void backend.budget
      .get(activeProfile.id)
      .then((result) => {
        if (!cancelled) setBudget(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [backend, activeProfile]);

  /* --------------------------------------------------------- ORDER SYNC --- */

  // Delivers the tracking progression (Confirmed → … → Delivered) and raises the
  // matching notifications. Runs every 20 seconds while the app is open.
  useEffect(() => {
    if (status !== 'authenticated' || !backend) return;
    const tick = async () => {
      try {
        const next = await backend.orders.syncStatuses();
        setOrders(sortOrdersNewestFirst(next));
        setNotifications(await backend.notifications.list());
      } catch {
        // A failed background sync is silent — the next tick retries.
      }
    };
    const timer = window.setInterval(tick, 20_000);
    return () => window.clearInterval(timer);
  }, [status, backend]);

  /* ------------------------------------------------------- HOUSEKEEPING --- */

  // Real events only: pantry items about to expire and the weekly plan digest.
  useEffect(() => {
    if (!backend || !ready || !user || housekeepingDone.current) return;
    housekeepingDone.current = true;
    void (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        if (preferences.notifyPantryExpiry) {
          const expiring = pantryItems.filter((item) => {
            const days = Math.round(
              (new Date(`${item.expiryDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000,
            );
            return days >= 0 && days <= 3;
          });
          const alreadySent = notifications.some(
            (item) => item.type === 'Pantry Expiring' && item.createdAt.slice(0, 10) === today,
          );
          if (expiring.length > 0 && !alreadySent) {
            await backend.notifications.create({
              type: 'Pantry Expiring',
              title: `${expiring.length} pantry item${expiring.length === 1 ? '' : 's'} expiring soon`,
              message: expiring
                .slice(0, 3)
                .map((item) => `${item.name} (${item.expiryDate})`)
                .join(', '),
              actionPath: '/pantry',
              personProfileId: activeProfile?.id ?? null,
              isImportant: true,
            });
          }
        }

        if (preferences.notifyWeeklyPlan && mealPlan && mealPlan.items.length > 0) {
          const alreadySent = notifications.some(
            (item) => item.type === 'Weekly Plan Ready' && item.createdAt.slice(0, 10) === today,
          );
          if (!alreadySent) {
            await backend.notifications.create({
              type: 'Weekly Plan Ready',
              title: 'Your weekly meal plan is ready',
              message: `${mealPlan.items.length} meal${mealPlan.items.length === 1 ? '' : 's'} planned for the week of ${mealPlan.weekStart}. Review the shopping list.`,
              actionPath: '/meal-planner',
              personProfileId: activeProfile?.id ?? null,
            });
          }
        }

        setNotifications(await backend.notifications.list());
      } catch {
        // Housekeeping must never break the app.
      }
    })();
  }, [backend, ready, user, notifications, pantryItems, mealPlan, preferences, activeProfile]);

  const pricedCart = useMemo(() => priceCart(cart, getProductById), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.productId)), [wishlist]);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const defaultAddress = useMemo(() => addresses.find((address) => address.isDefault) ?? addresses[0] ?? null, [addresses]);
  const currentOrder = useMemo(() => activeOrderOf(orders), [orders]);

  /** Shared cart merge used by Wishlist, Recipes, Pantry, Meal Planner and Smart Grocery. */
  const addMany = useCallback(
    async (lines: Array<{ productId: number; quantity: number }>) => {
      const filtered = lines.filter((line) => line.quantity > 0 && getProductById(line.productId));
      if (filtered.length === 0) return 0;
      // Collapse duplicate product lines so the cart (one row per user + product)
      // and the toast count stay in sync with what was actually merged.
      const aggregated = new Map<number, number>();
      for (const line of filtered) {
        aggregated.set(line.productId, (aggregated.get(line.productId) ?? 0) + line.quantity);
      }
      const payload = [...aggregated.entries()].map(([productId, quantity]) => ({ productId, quantity }));
      const next = await requireBackend()
        .cart.merge(payload)
        .catch((error) => fail(error, 'Could not add those items'));
      setCart(next);
      toast.success(`${payload.length} item${payload.length === 1 ? '' : 's'} added to your cart`);
      return payload.length;
    },
    [requireBackend, fail, toast],
  );

  const value: AppDataValue = {
    ready,
    loading,
    needsProfileSetup: ready && profiles.length === 0,
    profiles,
    activeProfile,
    addresses,
    defaultAddress,
    cart,
    pricedCart,
    cartCount,
    wishlist,
    wishlistIds,
    orders,
    currentOrder,
    pantryItems,
    mealPlan,
    weekStart,
    budget,
    notifications,
    unreadCount,
    preferences,

    async createProfile(input) {
      const created = await requireBackend()
        .profiles.create(input)
        .catch((error) => fail(error, 'Could not save that profile'));
      setProfiles(await requireBackend().profiles.list());
      return created;
    },

    async updateProfile(id, input) {
      const updated = await requireBackend()
        .profiles.update(id, input)
        .catch((error) => fail(error, 'Could not update that profile'));
      setProfiles(await requireBackend().profiles.list());
      return updated;
    },

    async deleteProfile(id) {
      await requireBackend()
        .profiles.remove(id)
        .catch((error) => fail(error, 'Could not delete that profile'));
      setProfiles(await requireBackend().profiles.list());
      setPantryItems(await requireBackend().pantry.list());
    },

    async setActiveProfile(id) {
      const next = await requireBackend()
        .profiles.setActive(id)
        .catch((error) => fail(error, 'Could not switch profile'));
      setProfiles(next);
      setBudget(await requireBackend().budget.get(id));
    },

    async createAddress(input) {
      const created = await requireBackend()
        .addresses.create(input)
        .catch((error) => fail(error, 'Could not save that address'));
      setAddresses(await requireBackend().addresses.list());
      return created;
    },

    async updateAddress(id, input) {
      const updated = await requireBackend()
        .addresses.update(id, input)
        .catch((error) => fail(error, 'Could not update that address'));
      setAddresses(await requireBackend().addresses.list());
      return updated;
    },

    async deleteAddress(id) {
      await requireBackend()
        .addresses.remove(id)
        .catch((error) => fail(error, 'Could not delete that address'));
      setAddresses(await requireBackend().addresses.list());
    },

    async setDefaultAddress(id) {
      const next = await requireBackend()
        .addresses.setDefault(id)
        .catch((error) => fail(error, 'Could not set the default address'));
      setAddresses(next);
    },

    async setCartQuantity(productId, quantity) {
      const next = await requireBackend()
        .cart.setQuantity(productId, quantity)
        .catch((error) => fail(error, 'Could not update your cart'));
      setCart(next);
    },

    async addToCart(productId, quantity = 1) {
      const product = getProductById(productId);
      const next = await requireBackend()
        .cart.increment(productId, quantity)
        .catch((error) => fail(error, 'Could not add that item'));
      setCart(next);
      if (product) toast.success(`${product.name} added to cart`);
    },

    addManyToCart: addMany,

    async removeFromCart(productId) {
      const product = getProductById(productId);
      const next = await requireBackend()
        .cart.remove(productId)
        .catch((error) => fail(error, 'Could not remove that item'));
      setCart(next);
      if (product) toast.info(`${product.name} removed from cart`);
    },

    async clearCart() {
      await requireBackend()
        .cart.clear()
        .catch((error) => fail(error, 'Could not empty your cart'));
      setCart([]);
    },

    async toggleWishlist(productId) {
      const next = await requireBackend()
        .wishlist.toggle(productId)
        .catch((error) => fail(error, 'Could not update your wishlist'));
      setWishlist(next);
      const product = getProductById(productId);
      if (product) {
        toast.success(
          next.some((item) => item.productId === productId)
            ? `${product.name} saved to wishlist`
            : `${product.name} removed from wishlist`,
        );
      }
    },

    async addWishlistToCart(productIds) {
      return addMany(productIds.map((productId) => ({ productId, quantity: 1 })));
    },

    async placeOrder(input) {
      if (!user) throw toAppError(new Error('Please sign in again'));
      if (!activeProfile) throw toAppError(new Error('Select who you are shopping for before checking out.'));
      if (cart.length === 0) throw toAppError(new Error('Your cart is empty. Add a few groceries before checking out.'));
      const order = await requireBackend()
        .orders.place({
          personProfileId: activeProfile.id,
          addressId: input.addressId,
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
          cartLines: cart,
          notes: input.notes,
        })
        .catch((error) => fail(error, 'Could not place your order'));
      // Cart → empty, Orders/Budget/Purchased Nutrition/Overview/For You all follow.
      setCart([]);
      setOrders(sortOrdersNewestFirst(await requireBackend().orders.list()));
      setNotifications(await requireBackend().notifications.list());
      setBudget(await requireBackend().budget.get(activeProfile.id));
      return order;
    },

    async cancelOrder(orderId) {
      const cancelled = await requireBackend()
        .orders.cancel(orderId)
        .catch((error) => fail(error, 'Could not cancel that order'));
      setOrders(sortOrdersNewestFirst(await requireBackend().orders.list()));
      setNotifications(await requireBackend().notifications.list());
      return cancelled;
    },

    async reorder(order) {
      return addMany(
        order.items
          .filter((item) => getProductById(item.productId))
          .map((item) => ({ productId: item.productId, quantity: item.quantity })),
      );
    },

    async createPantryItem(input) {
      const created = await requireBackend()
        .pantry.create(input)
        .catch((error) => fail(error, 'Could not add that pantry item'));
      setPantryItems(await requireBackend().pantry.list());
      return created;
    },

    async updatePantryItem(id, input) {
      const updated = await requireBackend()
        .pantry.update(id, input)
        .catch((error) => fail(error, 'Could not update that pantry item'));
      setPantryItems(await requireBackend().pantry.list());
      return updated;
    },

    async deletePantryItem(id) {
      await requireBackend()
        .pantry.remove(id)
        .catch((error) => fail(error, 'Could not delete that pantry item'));
      setPantryItems(await requireBackend().pantry.list());
    },

    async adjustPantryItem(id, delta) {
      await requireBackend()
        .pantry.adjust(id, delta)
        .catch((error) => fail(error, 'Could not update the pantry quantity'));
      setPantryItems(await requireBackend().pantry.list());
    },

    async addProductsToPantry(lines) {
      let added = 0;
      for (const line of lines) {
        const product = getProductById(line.productId);
        if (!product) continue;
        await requireBackend().pantry.create({
          personProfileId: activeProfile?.id ?? 0,
          productId: product.id,
          name: product.name,
          category: product.category,
          quantity: product.packSize * line.quantity,
          unit: product.packUnit,
          purchaseDate: new Date().toISOString().slice(0, 10),
          expiryDate: '',
          notes: 'Added from an order',
        });
        added += 1;
      }
      setPantryItems(await requireBackend().pantry.list());
      return added;
    },

    async loadMealPlanWeek(nextWeekStart) {
      setWeekStart(nextWeekStart);
      setMealPlan(await requireBackend().mealPlans.getWeek(nextWeekStart));
    },

    async addMeal(day, slot, recipeId, servings, weekStartOverride?: string) {
      const start = weekStartOverride ?? weekStart;
      const plan = await requireBackend()
        .mealPlans.addItem(day, slot, recipeId, servings, start)
        .catch((error) => fail(error, 'Could not add that meal'));
      setMealPlan(plan);
    },

    async updateMeal(itemId, patch) {
      const plan = await requireBackend()
        .mealPlans.updateItem(itemId, patch)
        .catch((error) => fail(error, 'Could not update that meal'));
      setMealPlan(plan);
    },

    async removeMeal(itemId) {
      const plan = await requireBackend()
        .mealPlans.removeItem(itemId)
        .catch((error) => fail(error, 'Could not remove that meal'));
      setMealPlan(plan);
    },

    async saveBudget(amount, period) {
      if (!activeProfile) return;
      const saved = await requireBackend()
        .budget.save(activeProfile.id, amount, period)
        .catch((error) => fail(error, 'Could not save your budget'));
      setBudget(saved);
      toast.success('Budget updated');
    },

    async savePreferences(next) {
      setPreferences(
        await requireBackend()
          .preferences.save(next)
          .catch((error) => fail(error, 'Could not save your settings')),
      );
    },

    async pushNotification(draft) {
      await requireBackend().notifications.create(draft);
      setNotifications(await requireBackend().notifications.list());
    },

    async markNotificationRead(id) {
      const next = await requireBackend()
        .notifications.markRead(id)
        .catch(() => null);
      if (next) setNotifications(next);
    },

    async markAllNotificationsRead() {
      setNotifications(
        await requireBackend()
          .notifications.markAllRead()
          .catch((error) => fail(error, 'Could not mark notifications as read')),
      );
    },

    async removeNotification(id) {
      setNotifications(
        await requireBackend()
          .notifications.remove(id)
          .catch((error) => fail(error, 'Could not dismiss that notification')),
      );
    },

    refresh,

    clearAllLocalData() {
      try {
        window.localStorage.clear();
      } finally {
        window.location.reload();
      }
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppDataValue(): AppDataValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('App data hooks must be used inside AppDataProvider');
  return context;
}
