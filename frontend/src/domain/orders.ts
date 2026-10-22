import type {
  Address,
  CartLine,
  DeliveryEstimate,
  NutritionFacts,
  Order,
  OrderItem,
  OrderStatus,
  OrderTrackingStep,
  PaymentMethod,
  PersonProfile,
  Product,
  User,
} from '@/types';
import { ORDER_CANCELLATION_WINDOW_MS } from '@/types';
import { PRICING, roundRupees } from './pricing';

/**
 * Order lifecycle rules.
 * Statuses progress on a fixed timeline inside the 10–20 minute delivery target,
 * so tracking works live in the browser, while the Java backend advances the same
 * statuses with a scheduled task (@Scheduled OrderLifecycleJob).
 */
export const STATUS_TIMELINE_MINUTES: Array<{ status: OrderStatus; minute: number; description: string }> = [
  { status: 'Confirmed', minute: 0, description: 'Order received and payment confirmed' },
  { status: 'Processing', minute: 2, description: 'Your groceries are being picked' },
  { status: 'Packed', minute: 5, description: 'Packed and handed to the delivery partner' },
  { status: 'Out for Delivery', minute: 8, description: 'On the way to your address' },
  { status: 'Delivered', minute: 15, description: 'Delivered to your doorstep' },
];

export const DELIVERY_WINDOW = { minMinutes: 10, maxMinutes: 20 };

export function estimateDelivery(createdAtIso: string): DeliveryEstimate {
  const created = new Date(createdAtIso).getTime();
  return {
    minMinutes: DELIVERY_WINDOW.minMinutes,
    maxMinutes: DELIVERY_WINDOW.maxMinutes,
    windowStart: new Date(created + DELIVERY_WINDOW.minMinutes * 60_000).toISOString(),
    windowEnd: new Date(created + DELIVERY_WINDOW.maxMinutes * 60_000).toISOString(),
  };
}

export function buildOrderNumber(sequence: number, createdAt: Date = new Date()): string {
  const stamp = `${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}`;
  return `NC-${stamp}-${String(sequence).padStart(4, '0')}`;
}

function emptyNutrition(): NutritionFacts {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
}

/** Nutrition contained in the groceries of an order (per purchased unit × quantity). */
export function nutritionForItems(items: OrderItem[]): NutritionFacts {
  const totals = items.reduce<NutritionFacts>((acc, item) => {
    acc.calories += item.calories * item.quantity;
    acc.protein += item.protein * item.quantity;
    acc.carbs += item.carbs * item.quantity;
    acc.fat += item.fat * item.quantity;
    acc.fiber += item.fiber * item.quantity;
    return acc;
  }, emptyNutrition());
  return {
    calories: Math.round(totals.calories),
    protein: roundRupees(totals.protein),
    carbs: roundRupees(totals.carbs),
    fat: roundRupees(totals.fat),
    fiber: roundRupees(totals.fiber),
  };
}

export interface BuildOrderInput {
  id: number;
  sequence: number;
  user: User;
  person: PersonProfile;
  address: Address;
  cartLines: CartLine[];
  resolveProduct: (productId: number) => Product | undefined;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  createdAt?: string;
  notes?: string;
}

/**
 * Creates a complete, self-contained order snapshot from the global cart.
 * Prices and nutrition are captured at purchase time, so later catalogue edits
 * never change historic orders or invoices.
 */
export function buildOrder(input: BuildOrderInput): Order {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const items: OrderItem[] = input.cartLines
    .map((line): OrderItem | null => {
      const product = input.resolveProduct(line.productId);
      if (!product || line.quantity <= 0) return null;
      const unitPrice = product.price;
      return {
        productId: product.id,
        code: product.code,
        name: product.name,
        image: product.image,
        unit: product.unit,
        category: product.category,
        unitPrice,
        quantity: line.quantity,
        lineTotal: roundRupees(unitPrice * line.quantity),
        calories: product.nutritionPerUnit.calories,
        protein: product.nutritionPerUnit.protein,
        carbs: product.nutritionPerUnit.carbs,
        fat: product.nutritionPerUnit.fat,
        fiber: product.nutritionPerUnit.fiber,
      };
    })
    .filter((item): item is OrderItem => item !== null);

  const subtotal = roundRupees(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const discountPercent = PRICING.discountTiers.find((tier) => subtotal >= tier.minSubtotal)?.percent ?? 0;
  const discount = roundRupees((subtotal * discountPercent) / 100);
  const delivery = subtotal >= PRICING.freeDeliveryThreshold ? 0 : PRICING.deliveryFee;
  const tax = roundRupees((subtotal - discount) * PRICING.taxRate);
  const grandTotal = roundRupees(subtotal - discount + delivery + tax);
  const estimate = estimateDelivery(createdAt);

  return {
    id: input.id,
    orderNumber: buildOrderNumber(input.sequence, new Date(createdAt)),
    userId: input.user.id,
    personProfileId: input.person.id,
    personName: input.person.name,
    customerName: input.user.fullName,
    address: {
      label: input.address.label,
      recipientName: input.address.recipientName,
      phone: input.address.phone,
      line1: input.address.line1,
      line2: input.address.line2,
      city: input.address.city,
      state: input.address.state,
      pincode: input.address.pincode,
    },
    items,
    subtotal,
    delivery,
    tax,
    discount,
    grandTotal,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference,
    status: 'Confirmed',
    createdAt,
    estimatedDeliveryAt: estimate.windowEnd,
    updatedAt: createdAt,
    deliveredAt: null,
    cancelledAt: null,
    nutrition: nutritionForItems(items),
    notes: input.notes ?? '',
  };
}

/** The status an order should be showing right now. */
export function effectiveStatus(order: Order, now: Date = new Date()): OrderStatus {
  if (order.status === 'Cancelled' || order.cancelledAt) return 'Cancelled';
  if (order.deliveredAt) return 'Delivered';
  const minutesElapsed = (now.getTime() - new Date(order.createdAt).getTime()) / 60_000;
  const reached = [...STATUS_TIMELINE_MINUTES].reverse().find((entry) => minutesElapsed >= entry.minute);
  return reached?.status ?? 'Confirmed';
}

/** Ordered tracking steps with completion flags for the tracking timeline. */
export function trackingSteps(order: Order, now: Date = new Date()): OrderTrackingStep[] {
  if (order.status === 'Cancelled' || order.cancelledAt) {
    return [
      {
        status: 'Confirmed',
        label: 'Confirmed',
        description: STATUS_TIMELINE_MINUTES[0].description,
        reachedAt: order.createdAt,
        isCurrent: false,
        isComplete: true,
      },
      {
        status: 'Cancelled',
        label: 'Cancelled',
        description: 'Order cancelled - no delivery will be attempted',
        reachedAt: order.cancelledAt ?? order.createdAt,
        isCurrent: true,
        isComplete: true,
      },
    ];
  }

  const current = effectiveStatus(order, now);
  const currentIndex = STATUS_TIMELINE_MINUTES.findIndex((entry) => entry.status === current);

  return STATUS_TIMELINE_MINUTES.map((entry, index) => ({
    status: entry.status,
    label: entry.status,
    description: entry.description,
    reachedAt:
      index <= currentIndex
        ? new Date(new Date(order.createdAt).getTime() + entry.minute * 60_000).toISOString()
        : null,
    isCurrent: index === currentIndex,
    isComplete: index < currentIndex,
  }));
}

/** 0-100 progress of the delivery timeline (0 once cancelled). */
export function orderProgressPercent(order: Order, now: Date = new Date()): number {
  if (order.status === 'Cancelled') return 0;
  const total = STATUS_TIMELINE_MINUTES[STATUS_TIMELINE_MINUTES.length - 1].minute;
  const elapsed = (now.getTime() - new Date(order.createdAt).getTime()) / 60_000;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

export interface CancellationState {
  canCancel: boolean;
  remainingMs: number;
  expiresAt: string;
}

/**
 * The 60 second cancellation window is derived from the order's stored createdAt
 * timestamp, so it stays correct after a page refresh or a brand new session.
 */
export function cancellationState(order: Order, now: Date = new Date()): CancellationState {
  const created = new Date(order.createdAt).getTime();
  const expires = created + ORDER_CANCELLATION_WINDOW_MS;
  const remainingMs = expires - now.getTime();
  const alreadyFinal = order.status === 'Cancelled' || effectiveStatus(order, now) === 'Delivered';
  return {
    canCancel: !alreadyFinal && remainingMs > 0,
    remainingMs: Math.max(0, remainingMs),
    expiresAt: new Date(expires).toISOString(),
  };
}

/** Items that can be pushed straight back into the global cart. */
export function reorderLines(order: Order): Array<{ productId: number; name: string; quantity: number }> {
  return order.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity }));
}

/** Newest first. */
export function sortOrdersNewestFirst(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The order that is currently in flight, if any. */
export function activeOrderOf(orders: Order[], now: Date = new Date()): Order | undefined {
  return sortOrdersNewestFirst(orders).find((order) => {
    const status = effectiveStatus(order, now);
    return status !== 'Delivered' && status !== 'Cancelled';
  });
}
