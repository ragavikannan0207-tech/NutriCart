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
  PaymentMethod,
  RegisterPayload,
  UserPreferences,
  WishlistItem,
} from '@/types';

/**
 * Every interface below is implemented TWICE:
 *
 *   services/http/*     -> Java Spring Boot REST API + MySQL (production path)
 *   services/local/*    -> browser persistence (development / offline fallback)
 *
 * The UI only ever talks to these contracts (through src/state), so switching
 * between the two implementations requires no page or component change.
 */

export type DataMode = 'api' | 'local';

export interface AuthService {
  session(): AuthSession | null;
  register(payload: RegisterPayload): Promise<AuthSession>;
  login(payload: LoginPayload): Promise<AuthSession>;
  logout(): Promise<void>;
  updateAccount(fullName: string): Promise<AuthSession>;
}

export interface ProfileService {
  list(): Promise<PersonProfile[]>;
  create(input: PersonProfileInput): Promise<PersonProfile>;
  update(id: number, input: PersonProfileInput): Promise<PersonProfile>;
  remove(id: number): Promise<void>;
  setActive(id: number): Promise<PersonProfile[]>;
}

export interface AddressService {
  list(): Promise<Address[]>;
  create(input: AddressInput): Promise<Address>;
  update(id: number, input: AddressInput): Promise<Address>;
  remove(id: number): Promise<void>;
  setDefault(id: number): Promise<Address[]>;
}

export interface CartService {
  get(): Promise<CartLine[]>;
  setQuantity(productId: number, quantity: number): Promise<CartLine[]>;
  increment(productId: number, delta: number): Promise<CartLine[]>;
  remove(productId: number): Promise<CartLine[]>;
  clear(): Promise<void>;
  merge(lines: Array<{ productId: number; quantity: number }>): Promise<CartLine[]>;
}

export interface WishlistService {
  list(): Promise<WishlistItem[]>;
  add(productId: number): Promise<WishlistItem[]>;
  remove(productId: number): Promise<WishlistItem[]>;
  toggle(productId: number): Promise<WishlistItem[]>;
}

export interface PlaceOrderInput {
  personProfileId: number;
  addressId: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  cartLines: CartLine[];
  notes?: string;
}

export interface OrderService {
  list(): Promise<Order[]>;
  get(id: number): Promise<Order | null>;
  place(input: PlaceOrderInput): Promise<Order>;
  cancel(id: number): Promise<Order>;
  /** Persists any status advance that is due right now. */
  syncStatuses(): Promise<Order[]>;
}

export interface PantryService {
  list(): Promise<PantryItem[]>;
  create(input: PantryItemInput): Promise<PantryItem>;
  update(id: number, input: PantryItemInput): Promise<PantryItem>;
  remove(id: number): Promise<void>;
  adjust(id: number, delta: number): Promise<PantryItem[] | null>;
}

export interface MealPlanService {
  getWeek(weekStart: string): Promise<MealPlan>;
  addItem(day: DayOfWeek, slot: MealSlot, recipeId: number, servings: number, weekStart?: string): Promise<MealPlan>;
  updateItem(
    itemId: number,
    patch: { servings?: number; recipeId?: number; day?: DayOfWeek; slot?: MealSlot },
  ): Promise<MealPlan>;
  removeItem(itemId: number): Promise<MealPlan>;
}

export interface BudgetService {
  get(personProfileId: number): Promise<Budget | null>;
  save(personProfileId: number, amount: number, period: BudgetPeriod): Promise<Budget>;
}

export interface NotificationService {
  list(): Promise<AppNotification[]>;
  create(draft: NotificationDraft): Promise<AppNotification>;
  markRead(id: number): Promise<AppNotification[]>;
  markAllRead(): Promise<AppNotification[]>;
  remove(id: number): Promise<AppNotification[]>;
}

export interface PreferenceService {
  get(): Promise<UserPreferences>;
  save(preferences: UserPreferences): Promise<UserPreferences>;
}

/** The complete persistence surface of NutriCart. */
export interface NutriCartBackend {
  mode: DataMode;
  auth: AuthService;
  profiles: ProfileService;
  addresses: AddressService;
  cart: CartService;
  wishlist: WishlistService;
  orders: OrderService;
  pantry: PantryService;
  mealPlans: MealPlanService;
  budget: BudgetService;
  notifications: NotificationService;
  preferences: PreferenceService;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  notifyOrderUpdates: true,
  notifyPantryExpiry: true,
  notifyBudgetAlerts: true,
  notifyRecommendations: true,
  notifyWeeklyPlan: true,
  nutritionPeriod: 'Weekly',
  defaultPantryUnit: 'g',
  mealPreference: 'Balanced',
  measurementSystem: 'Metric',
  currency: 'INR',
  lastPantryReview: null,
};
