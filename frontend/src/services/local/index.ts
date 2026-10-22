import type {
  Address,
  AddressInput,
  AppNotification,
  AuthSession,
  Budget,
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
  User,
  UserPreferences,
  WishlistItem,
} from '@/types';
import { getProductById } from '@/data/products';
import { buildOrder, effectiveStatus, sortOrdersNewestFirst } from '@/domain/orders';
import { shelfLifeDaysFor, addDays, todayIso } from '@/domain/pantry';
import { PRICING } from '@/domain/pricing';
import { AppError } from '@/utils/errors';
import { validateEmail, validateConfirmPassword, validatePassword } from '@/utils/validation';
import { normaliseQuantity } from '@/utils/units';
import {
  DEFAULT_PREFERENCES,
  type NutriCartBackend,
  type OrderService,
  type PlaceOrderInput,
} from '../contracts';
import { LocalDatabase, hashPassword, makeSalt, type LocalUserRecord } from './db';

function toUser(record: LocalUserRecord): User {
  return { id: record.id, fullName: record.fullName, email: record.email, createdAt: record.createdAt };
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createLocalBackend(): NutriCartBackend {
  const db = new LocalDatabase();

  /* --------------------------------------------------------------- AUTH -- */

  const auth = {
    session(): AuthSession | null {
      return db.session();
    },

    async register(payload: RegisterPayload): Promise<AuthSession> {
      const emailError = validateEmail(payload.email);
      if (emailError) throw new AppError(emailError, { status: 400, fieldErrors: { email: emailError } });
      const passwordError = validatePassword(payload.password);
      if (passwordError) throw new AppError(passwordError, { status: 400, fieldErrors: { password: passwordError } });
      const confirmError = validateConfirmPassword(payload.password, payload.confirmPassword);
      if (confirmError) throw new AppError(confirmError, { status: 400, fieldErrors: { confirmPassword: confirmError } });
      if (db.findUserByEmail(payload.email)) {
        throw new AppError('An account with this email already exists. Try signing in instead.', {
          status: 409,
          fieldErrors: { email: 'This email is already registered' },
        });
      }

      const salt = makeSalt();
      const record: LocalUserRecord = {
        id: db.nextUserId(),
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        passwordSalt: salt,
        passwordHash: await hashPassword(payload.password, salt),
        createdAt: nowIso(),
      };
      db.saveUsers([...db.users(), record]);

      const session: AuthSession = { token: `local-${record.id}-${Date.now()}`, user: toUser(record) };
      db.setSession(session);
      return session;
    },

    async login(payload: LoginPayload): Promise<AuthSession> {
      const record = db.findUserByEmail(payload.email);
      if (!record) throw new AppError('No NutriCart account uses that email address.', { status: 401 });
      const hash = await hashPassword(payload.password, record.passwordSalt);
      if (hash !== record.passwordHash) throw new AppError('That password is not correct.', { status: 401 });
      const session: AuthSession = { token: `local-${record.id}-${Date.now()}`, user: toUser(record) };
      db.setSession(session);
      return session;
    },

    async logout(): Promise<void> {
      // Logging out keeps the account AND every profile untouched.
      db.clearSession();
    },

    async updateAccount(fullName: string): Promise<AuthSession> {
      const user = db.requireUser();
      const users = db.users().map((row) => (row.id === user.id ? { ...row, fullName: fullName.trim() } : row));
      db.saveUsers(users);
      const session: AuthSession = { token: db.session()?.token ?? `local-${user.id}`, user: toUser({ ...user, fullName: fullName.trim() }) };
      db.setSession(session);
      return session;
    },
  };

  /* ----------------------------------------------------------- PROFILES -- */

  const profiles = {
    async list(): Promise<PersonProfile[]> {
      const user = db.requireUser();
      return db.profiles(user.id).sort((a, b) => a.id - b.id);
    },

    async create(input: PersonProfileInput): Promise<PersonProfile> {
      const user = db.requireUser();
      const rows = db.profiles(user.id);
      const profile: PersonProfile = {
        ...input,
        id: db.nextId(rows),
        userId: user.id,
        createdAt: nowIso(),
        isActive: rows.length === 0 ? true : (input.isActive ?? false),
      };
      const next = rows.map((row) => (profile.isActive ? { ...row, isActive: false } : row));
      db.save(user.id, 'profiles', [...next, profile]);
      return profile;
    },

    async update(id: number, input: PersonProfileInput): Promise<PersonProfile> {
      const user = db.requireUser();
      const rows = db.profiles(user.id);
      const existing = rows.find((row) => row.id === id);
      if (!existing) throw new AppError('That person profile no longer exists.', { status: 404 });
      const updated: PersonProfile = { ...existing, ...input };
      db.save(
        user.id,
        'profiles',
        rows.map((row) => (row.id === id ? updated : row)),
      );
      return updated;
    },

    async remove(id: number): Promise<void> {
      const user = db.requireUser();
      const rows = db.profiles(user.id);
      if (rows.length <= 1) throw new AppError('At least one person profile has to stay on the account.', { status: 400 });
      const remaining = rows.filter((row) => row.id !== id);
      const wasActive = rows.find((row) => row.id === id)?.isActive;
      const next = wasActive ? remaining.map((row, index) => ({ ...row, isActive: index === 0 })) : remaining;
      db.save(user.id, 'profiles', next);
      // Remove profile-scoped pantry + meal plans so no orphan data is left behind.
      db.save(user.id, 'pantry', db.pantry(user.id).filter((item) => item.personProfileId !== id));
      db.save(user.id, 'mealPlans', db.mealPlans(user.id).filter((plan) => plan.personProfileId !== id));
    },

    async setActive(id: number): Promise<PersonProfile[]> {
      const user = db.requireUser();
      const rows = db.profiles(user.id);
      if (!rows.some((row) => row.id === id)) throw new AppError('That person profile no longer exists.', { status: 404 });
      const next = rows.map((row) => ({ ...row, isActive: row.id === id }));
      db.save(user.id, 'profiles', next);
      return next;
    },
  };

  /* ---------------------------------------------------------- ADDRESSES -- */

  const addresses = {
    async list(): Promise<Address[]> {
      const user = db.requireUser();
      return db.addresses(user.id).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id);
    },

    async create(input: AddressInput): Promise<Address> {
      const user = db.requireUser();
      const rows = db.addresses(user.id);
      const address: Address = {
        ...input,
        id: db.nextId(rows),
        userId: user.id,
        isDefault: input.isDefault || rows.length === 0,
      };
      const next = address.isDefault ? rows.map((row) => ({ ...row, isDefault: false })) : rows;
      db.save(user.id, 'addresses', [...next, address]);
      return address;
    },

    async update(id: number, input: AddressInput): Promise<Address> {
      const user = db.requireUser();
      const rows = db.addresses(user.id);
      const existing = rows.find((row) => row.id === id);
      if (!existing) throw new AppError('That address no longer exists.', { status: 404 });
      const updated: Address = { ...existing, ...input };
      const next = rows.map((row) => (row.id === id ? updated : updated.isDefault ? { ...row, isDefault: false } : row));
      db.save(user.id, 'addresses', next);
      return updated;
    },

    async remove(id: number): Promise<void> {
      const user = db.requireUser();
      const remaining = db.addresses(user.id).filter((row) => row.id !== id);
      if (remaining.length > 0 && !remaining.some((row) => row.isDefault)) remaining[0].isDefault = true;
      db.save(user.id, 'addresses', remaining);
    },

    async setDefault(id: number): Promise<Address[]> {
      const user = db.requireUser();
      const next = db.addresses(user.id).map((row) => ({ ...row, isDefault: row.id === id }));
      db.save(user.id, 'addresses', next);
      return next;
    },
  };

  /* --------------------------------------------------------------- CART -- */

  const cart = {
    async get(): Promise<CartLine[]> {
      const user = db.requireUser();
      return db.cart(user.id);
    },

    async setQuantity(productId: number, quantity: number): Promise<CartLine[]> {
      const user = db.requireUser();
      const product = getProductById(productId);
      if (!product) throw new AppError('That product is no longer in the catalogue.', { status: 404 });
      if (quantity > 0 && product.stockCount <= 0) {
        throw new AppError(`${product.name} is out of stock right now.`, { status: 400 });
      }
      const lines = db.cart(user.id).filter((line) => line.productId !== productId);
      if (quantity > 0) lines.push({ productId, quantity, unitPrice: product.price, addedAt: nowIso() });
      return db.saveCart(user.id, lines);
    },

    async increment(productId: number, delta: number): Promise<CartLine[]> {
      const user = db.requireUser();
      const current = db.cart(user.id).find((line) => line.productId === productId)?.quantity ?? 0;
      return cart.setQuantity(productId, Math.max(0, current + delta));
    },

    async remove(productId: number): Promise<CartLine[]> {
      const user = db.requireUser();
      return db.saveCart(user.id, db.cart(user.id).filter((line) => line.productId !== productId));
    },

    async clear(): Promise<void> {
      const user = db.requireUser();
      db.saveCart(user.id, []);
    },

    async merge(lines: Array<{ productId: number; quantity: number }>): Promise<CartLine[]> {
      const user = db.requireUser();
      const current = db.cart(user.id);
      const map = new Map(current.map((line) => [line.productId, line]));
      for (const line of lines) {
        const product = getProductById(line.productId);
        if (!product || product.stockCount <= 0) continue;
        const existing = map.get(line.productId);
        map.set(line.productId, {
          productId: line.productId,
          quantity: (existing?.quantity ?? 0) + line.quantity,
          unitPrice: product.price,
          addedAt: existing?.addedAt ?? nowIso(),
        });
      }
      return db.saveCart(user.id, [...map.values()]);
    },
  };

  /* ----------------------------------------------------------- WISHLIST -- */

  const wishlist = {
    async list(): Promise<WishlistItem[]> {
      const user = db.requireUser();
      return db.wishlist(user.id).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    },

    async add(productId: number): Promise<WishlistItem[]> {
      const user = db.requireUser();
      if (!getProductById(productId)) throw new AppError('That product is no longer in the catalogue.', { status: 404 });
      const rows = db.wishlist(user.id);
      if (!rows.some((row) => row.productId === productId)) {
        rows.push({ productId, addedAt: nowIso() });
        db.save(user.id, 'wishlist', rows);
      }
      return wishlist.list();
    },

    async remove(productId: number): Promise<WishlistItem[]> {
      const user = db.requireUser();
      db.save(
        user.id,
        'wishlist',
        db.wishlist(user.id).filter((row) => row.productId !== productId),
      );
      return wishlist.list();
    },

    async toggle(productId: number): Promise<WishlistItem[]> {
      const user = db.requireUser();
      const exists = db.wishlist(user.id).some((row) => row.productId === productId);
      return exists ? wishlist.remove(productId) : wishlist.add(productId);
    },
  };

  /* ------------------------------------------------------------- ORDERS -- */

  const pushNotification = (draft: NotificationDraft): void => {
    const user = db.requireUser();
    const rows = db.notifications(user.id);
    const notification: AppNotification = {
      id: db.nextId(rows),
      userId: user.id,
      personProfileId: draft.personProfileId ?? null,
      type: draft.type,
      title: draft.title,
      message: draft.message,
      actionPath: draft.actionPath ?? '/orders',
      isImportant: draft.isImportant ?? false,
      isRead: false,
      createdAt: draft.createdAt ?? nowIso(),
    };
    db.save(user.id, 'notifications', [...rows, notification]);
  };

  const orders: OrderService = {
    async list(): Promise<Order[]> {
      const user = db.requireUser();
      return sortOrdersNewestFirst(db.orders(user.id));
    },

    async get(id: number): Promise<Order | null> {
      const user = db.requireUser();
      return db.orders(user.id).find((order) => order.id === id) ?? null;
    },

    async place(input: PlaceOrderInput): Promise<Order> {
      const user = db.requireUser();
      const profile = db.profiles(user.id).find((row) => row.id === input.personProfileId);
      if (!profile) throw new AppError('Select who you are shopping for before checking out.', { status: 400 });
      const address = db.addresses(user.id).find((row) => row.id === input.addressId);
      if (!address) throw new AppError('Add a delivery address to place this order.', { status: 400 });
      const cartLines = (input.cartLines.length > 0 ? input.cartLines : db.cart(user.id)).filter((line) => line.quantity > 0);
      if (cartLines.length === 0) throw new AppError('Your cart is empty. Add a few groceries before checking out.', { status: 400 });

      const rows = db.orders(user.id);
      const order = buildOrder({
        id: db.nextId(rows),
        sequence: rows.length + 1,
        user: toUser(user),
        person: profile,
        address,
        cartLines,
        resolveProduct: getProductById,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        notes: input.notes,
      });
      db.save(user.id, 'orders', [...rows, order]);
      // The global cart is emptied the moment the order exists.
      db.saveCart(user.id, []);
      pushNotification({
        type: 'Order Confirmed',
        title: `Order ${order.orderNumber} confirmed`,
        message: `${order.items.length} item${order.items.length === 1 ? '' : 's'} for ${profile.name} · arriving in ${10}-${20} minutes`,
        actionPath: `/orders/${order.id}`,
        personProfileId: profile.id,
        isImportant: true,
      });
      checkBudgetWarning(profile.id, profile.name);
      return order;
    },

    async cancel(id: number): Promise<Order> {
      const user = db.requireUser();
      const rows = db.orders(user.id);
      const order = rows.find((row) => row.id === id);
      if (!order) throw new AppError('We could not find that order.', { status: 404 });
      if (order.status === 'Cancelled') return order;
      const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
      if (elapsedMs > 60_000) {
        throw new AppError('Orders can only be cancelled within 60 seconds of being placed.', { status: 400 });
      }
      const cancelled: Order = { ...order, status: 'Cancelled', cancelledAt: nowIso(), updatedAt: nowIso() };
      db.save(
        user.id,
        'orders',
        rows.map((row) => (row.id === id ? cancelled : row)),
      );
      pushNotification({
        type: 'Cancelled',
        title: `Order ${order.orderNumber} cancelled`,
        message: 'This order was cancelled within the 60 second window. No amount will be charged.',
        actionPath: `/orders/${order.id}`,
        personProfileId: order.personProfileId,
        isImportant: true,
      });
      return cancelled;
    },

    async syncStatuses(): Promise<Order[]> {
      const user = db.requireUser();
      const rows = db.orders(user.id);
      let changed = false;
      const next = rows.map((order) => {
        if (order.status === 'Cancelled' || order.status === 'Delivered') return order;
        const status = effectiveStatus(order);
        if (status === order.status) return order;
        changed = true;
        const updated: Order = {
          ...order,
          status,
          updatedAt: nowIso(),
          deliveredAt: status === 'Delivered' ? nowIso() : order.deliveredAt,
        };
        if (status === 'Out for Delivery') {
          pushNotification({
            type: 'Out for Delivery',
            title: `Order ${order.orderNumber} is out for delivery`,
            message: 'Your delivery partner is on the way. Keep the phone handy.',
            actionPath: `/orders/${order.id}`,
            personProfileId: order.personProfileId,
            isImportant: true,
          });
        }
        if (status === 'Delivered') {
          pushNotification({
            type: 'Delivered',
            title: `Order ${order.orderNumber} delivered`,
            message: 'Your groceries have been delivered. Download the invoice from the order.',
            actionPath: `/orders/${order.id}`,
            personProfileId: order.personProfileId,
            isImportant: true,
          });
        }
        return updated;
      });
      if (changed) db.save(user.id, 'orders', next);
      return sortOrdersNewestFirst(next);
    },
  };

  function checkBudgetWarning(personProfileId: number, personName: string): void {
    const user = db.requireUser();
    const budget = db.budgets(user.id).find((row) => row.personProfileId === personProfileId);
    if (!budget || budget.amount <= 0) return;
    const { spent, periodStart } = spendFor(user.id, budget);
    if (spent <= budget.amount) return;
    const alreadyWarned = db
      .notifications(user.id)
      .some((row) => row.type === 'Budget Warning' && row.personProfileId === personProfileId && row.createdAt.slice(0, 10) === todayIso());
    if (alreadyWarned) return;
    pushNotification({
      type: 'Budget Warning',
      title: `${personName}'s ${budget.period.toLowerCase()} budget is exceeded`,
      message: `Orders since ${periodStart} total more than the ₹${Math.round(budget.amount)} you set.`,
      actionPath: '/budget',
      personProfileId,
      isImportant: true,
    });
  }

  function spendFor(userId: number, budget: Budget): { spent: number; periodStart: string } {
    const days = budget.period === 'Weekly' ? 7 : new Date().getDate();
    const periodStart = todayIso(new Date(Date.now() - (days - 1) * 86_400_000));
    const spent = db
      .orders(userId)
      .filter((order) => order.status !== 'Cancelled' && order.personProfileId === budget.personProfileId)
      .filter((order) => order.createdAt.slice(0, 10) >= periodStart)
      .reduce((sum, order) => sum + order.grandTotal, 0);
    return { spent, periodStart };
  }

  /* ------------------------------------------------------------- PANTRY -- */

  function buildPantryItem(userId: number, rows: PantryItem[], input: PantryItemInput): PantryItem {
    const product = input.productId ? getProductById(input.productId) : undefined;
    const purchaseDate = input.purchaseDate || todayIso();
    const hasPrintedDate = Boolean(input.expiryDate);
    const expiryDate = hasPrintedDate
      ? input.expiryDate
      : addDays(purchaseDate, shelfLifeDaysFor(product, input.name));
    const normalised = normaliseQuantity(input.quantity, input.unit, product);
    return {
      ...input,
      id: db.nextId(rows),
      userId,
      purchaseDate,
      expiryDate,
      expiryEstimated: input.expiryEstimated ?? !hasPrintedDate,
      normalisedQuantity: normalised.quantity,
      normalisedUnit: normalised.unit,
      createdAt: nowIso(),
    };
  }

  const pantry = {
    async list(): Promise<PantryItem[]> {
      const user = db.requireUser();
      return db.pantry(user.id).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    },

    async create(input: PantryItemInput): Promise<PantryItem> {
      const user = db.requireUser();
      const rows = db.pantry(user.id);
      const item = buildPantryItem(user.id, rows, input);
      db.save(user.id, 'pantry', [...rows, item]);
      return item;
    },

    async update(id: number, input: PantryItemInput): Promise<PantryItem> {
      const user = db.requireUser();
      const rows = db.pantry(user.id);
      const existing = rows.find((row) => row.id === id);
      if (!existing) throw new AppError('That pantry item no longer exists.', { status: 404 });
      const product = input.productId ? getProductById(input.productId) : undefined;
      const normalised = normaliseQuantity(input.quantity, input.unit, product);
      const updated: PantryItem = {
        ...existing,
        ...input,
        normalisedQuantity: normalised.quantity,
        normalisedUnit: normalised.unit,
      };
      db.save(
        user.id,
        'pantry',
        rows.map((row) => (row.id === id ? updated : row)),
      );
      return updated;
    },

    async remove(id: number): Promise<void> {
      const user = db.requireUser();
      db.save(
        user.id,
        'pantry',
        db.pantry(user.id).filter((row) => row.id !== id),
      );
    },

    async adjust(id: number, delta: number): Promise<PantryItem[] | null> {
      const user = db.requireUser();
      const rows = db.pantry(user.id);
      const existing = rows.find((row) => row.id === id);
      if (!existing) throw new AppError('That pantry item no longer exists.', { status: 404 });
      const quantity = Math.max(0, Number((existing.quantity + delta).toFixed(2)));
      if (quantity === 0) {
        await pantry.remove(id);
        return null;
      }
      const normalised = normaliseQuantity(quantity, existing.unit, existing.productId ? getProductById(existing.productId) : undefined);
      db.save(
        user.id,
        'pantry',
        rows.map((row) => (row.id === id ? { ...row, quantity, normalisedQuantity: normalised.quantity } : row)),
      );
      return pantry.list();
    },
  };

  /* --------------------------------------------------------- MEAL PLANS -- */

  const mealPlans = {
    async getWeek(weekStart: string): Promise<MealPlan> {
      const user = db.requireUser();
      const profile = db.profiles(user.id).find((row) => row.isActive) ?? db.profiles(user.id)[0];
      const rows = db.mealPlans(user.id);
      const existing = rows.find((plan) => plan.weekStart === weekStart && plan.personProfileId === profile?.id);
      if (existing) return existing;
      const plan: MealPlan = {
        id: db.nextId(rows),
        userId: user.id,
        personProfileId: profile?.id ?? 0,
        weekStart,
        items: [],
        createdAt: nowIso(),
      };
      db.save(user.id, 'mealPlans', [...rows, plan]);
      return plan;
    },

    async addItem(day: DayOfWeek, slot: MealSlot, recipeId: number, servings: number, weekStart?: string): Promise<MealPlan> {
      const user = db.requireUser();
      const start = weekStart ?? mealPlanWeekStart(day);
      const plan = await mealPlans.getWeek(start);
      const rows = db.mealPlans(user.id);
      const item = {
        id: plan.items.length === 0 ? 1 : Math.max(...plan.items.map((entry) => entry.id)) + 1,
        mealPlanId: plan.id,
        day,
        slot,
        recipeId,
        servings,
      };
      const updated: MealPlan = { ...plan, items: [...plan.items, item] };
      db.save(
        user.id,
        'mealPlans',
        rows.map((row) => (row.id === plan.id ? updated : row)),
      );
      return updated;
    },

    async updateItem(
      itemId: number,
      patch: { servings?: number; recipeId?: number; day?: DayOfWeek; slot?: MealSlot },
    ): Promise<MealPlan> {
      const user = db.requireUser();
      const rows = db.mealPlans(user.id);
      const plan = rows.find((entry) => entry.items.some((item) => item.id === itemId));
      if (!plan) throw new AppError('That planned meal no longer exists.', { status: 404 });
      const updated: MealPlan = {
        ...plan,
        items: plan.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      };
      db.save(
        user.id,
        'mealPlans',
        rows.map((row) => (row.id === plan.id ? updated : row)),
      );
      return updated;
    },

    async removeItem(itemId: number): Promise<MealPlan> {
      const user = db.requireUser();
      const rows = db.mealPlans(user.id);
      const plan = rows.find((entry) => entry.items.some((item) => item.id === itemId));
      if (!plan) throw new AppError('That planned meal no longer exists.', { status: 404 });
      const updated: MealPlan = { ...plan, items: plan.items.filter((item) => item.id !== itemId) };
      db.save(
        user.id,
        'mealPlans',
        rows.map((row) => (row.id === plan.id ? updated : row)),
      );
      return updated;
    },
  };

  /* ------------------------------------------------------------- BUDGET -- */

  const budget = {
    async get(personProfileId: number): Promise<Budget | null> {
      const user = db.requireUser();
      return db.budgets(user.id).find((row) => row.personProfileId === personProfileId) ?? null;
    },

    async save(personProfileId: number, amount: number, period: Budget['period']): Promise<Budget> {
      const user = db.requireUser();
      const rows = db.budgets(user.id);
      const existing = rows.find((row) => row.personProfileId === personProfileId);
      const saved: Budget = {
        id: existing?.id ?? db.nextId(rows),
        userId: user.id,
        personProfileId,
        period,
        amount: Math.max(0, amount),
        updatedAt: nowIso(),
      };
      db.save(user.id, 'budgets', [...rows.filter((row) => row.personProfileId !== personProfileId), saved]);
      return saved;
    },
  };

  /* ------------------------------------------------------ NOTIFICATIONS -- */

  const notifications = {
    async list(): Promise<AppNotification[]> {
      const user = db.requireUser();
      return db.notifications(user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async create(draft: NotificationDraft): Promise<AppNotification> {
      pushNotification(draft);
      return (await notifications.list())[0];
    },

    async markRead(id: number): Promise<AppNotification[]> {
      const user = db.requireUser();
      db.save(
        user.id,
        'notifications',
        db.notifications(user.id).map((row) => (row.id === id ? { ...row, isRead: true } : row)),
      );
      return notifications.list();
    },

    async markAllRead(): Promise<AppNotification[]> {
      const user = db.requireUser();
      db.save(
        user.id,
        'notifications',
        db.notifications(user.id).map((row) => ({ ...row, isRead: true })),
      );
      return notifications.list();
    },

    async remove(id: number): Promise<AppNotification[]> {
      const user = db.requireUser();
      db.save(
        user.id,
        'notifications',
        db.notifications(user.id).filter((row) => row.id !== id),
      );
      return notifications.list();
    },
  };

  /* -------------------------------------------------------- PREFERENCES -- */

  const preferences = {
    async get(): Promise<UserPreferences> {
      const user = db.requireUser();
      return db.preferences(user.id);
    },

    async save(next: UserPreferences): Promise<UserPreferences> {
      const user = db.requireUser();
      return db.savePreferences(user.id, { ...DEFAULT_PREFERENCES, ...next });
    },
  };

  return {
    mode: 'local',
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

/** Monday of the week that contains the given day (relative to today). */
function mealPlanWeekStart(_day: DayOfWeek): string {
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today.getTime() - todayIndex * 86_400_000);
  // Meals always belong to the current week's plan (the Monday of this week),
  // never silently shifted into next week.
  return todayIso(monday);
}

export { PRICING };
