import { describe, expect, it } from 'vitest';
import {
  buildOrder,
  DELIVERY_WINDOW,
  effectiveStatus,
  estimateDelivery,
  orderProgressPercent,
  reorderLines,
  trackingSteps,
} from '../orders';
import { getProductById } from '@/data/products';
import type { Address, CartLine, Order, PersonProfile, User } from '@/types';

const user: User = {
  id: 1,
  fullName: 'Verify Tester',
  email: 'verify.backend@gmail.com',
  createdAt: '2026-10-05T09:00:00Z',
};

const person: PersonProfile = {
  id: 3,
  userId: 1,
  name: 'Ragavi',
  age: 28,
  gender: 'Male',
  heightCm: 172,
  weightKg: 68,
  activityLevel: 'Moderately Active',
  dietType: 'No Restriction',
  healthGoal: 'Muscle Gain',
  budgetAmount: 2500,
  budgetPeriod: 'Weekly',
  allergies: [],
  foodPreferences: ['high protein'],
  isActive: true,
  createdAt: '2026-10-05T09:00:00Z',
};

const address: Address = {
  id: 1,
  userId: 1,
  label: 'Home',
  recipientName: 'Ragavi',
  phone: '9876543210',
  line1: '12 Green Park Street',
  line2: 'Apt 4B',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600001',
  isDefault: true,
};

const cartLine = (productId: number, quantity: number): CartLine => ({
  productId,
  quantity,
  unitPrice: getProductById(productId)?.price ?? 0,
  addedAt: '2026-10-05T09:07:00Z',
});

/** Builds a real order with the same helper the application uses. */
const makeOrder = (createdAt = '2026-10-05T09:07:00.000Z'): Order =>
  buildOrder({
    id: 1,
    sequence: 1,
    user,
    person,
    address,
    cartLines: [cartLine(20, 4), cartLine(1, 2), cartLine(30, 1)],
    resolveProduct: getProductById,
    paymentMethod: 'UPI',
    paymentReference: 'UPI ragavi@okhdfcbank',
    createdAt,
  });

describe('order building (the same basket that was placed against MySQL)', () => {
  const order = makeOrder();

  it('produces the reference and pricing the backend produced', () => {
    expect(order.orderNumber).toMatch(/^NC-\d{8}-\d{4}$/);
    expect(order.personName).toBe('Ragavi');
    expect(order.customerName).toBe('Verify Tester');
    expect(order.address.pincode).toBe('600001');
    expect(order.subtotal).toBe(988);
    expect(order.delivery).toBe(0);
    expect(order.tax).toBe(49.4);
    expect(order.grandTotal).toBe(1037.4);
    expect(order.paymentReference).toBe('UPI ragavi@okhdfcbank');
    expect(order.status).toBe('Confirmed');
  });

  it('captures the nutrition snapshot used by Purchased Nutrition', () => {
    expect(order.nutrition.calories).toBe(6948);
    expect(order.nutrition.protein).toBe(251);
    expect(order.items).toHaveLength(3);
    expect(order.items.reduce((sum, item) => sum + item.quantity, 0)).toBe(7);
  });

  it('promises delivery inside the 10–20 minute window', () => {
    const estimate = estimateDelivery(order.createdAt);

    expect(estimate.minMinutes).toBe(DELIVERY_WINDOW.minMinutes);
    expect(estimate.maxMinutes).toBe(DELIVERY_WINDOW.maxMinutes);
    expect(new Date(order.estimatedDeliveryAt).getTime()).toBeGreaterThan(new Date(order.createdAt).getTime());
  });

  it('reorders the exact same products', () => {
    expect(reorderLines(order)).toEqual([
      { productId: 20, name: expect.stringContaining('Paneer'), quantity: 4 },
      { productId: 1, name: expect.stringContaining('Avocado'), quantity: 2 },
      { productId: 30, name: expect.stringContaining('Brown Rice'), quantity: 1 },
    ]);
  });
});

describe('tracking timeline', () => {
  const created = '2026-10-05T09:07:00.000Z';
  const at = (minutes: number) => new Date(new Date(created).getTime() + minutes * 60_000);

  it('walks Confirmed → Processing → Packed → Out for Delivery → Delivered', () => {
    expect(effectiveStatus(makeOrder(created), at(0))).toBe('Confirmed');
    expect(effectiveStatus(makeOrder(created), at(3))).toBe('Processing');
    expect(effectiveStatus(makeOrder(created), at(6))).toBe('Packed');
    expect(effectiveStatus(makeOrder(created), at(9))).toBe('Out for Delivery');
    expect(effectiveStatus(makeOrder(created), at(15))).toBe('Delivered');
  });

  it('reports progress and never offers it for a cancelled order', () => {
    expect(orderProgressPercent(makeOrder(created), at(0))).toBe(0);
    expect(orderProgressPercent(makeOrder(created), at(7.5))).toBe(50);
    expect(orderProgressPercent(makeOrder(created), at(30))).toBe(100);

    const cancelled: Order = { ...makeOrder(created), status: 'Cancelled' };
    expect(orderProgressPercent(cancelled, at(1))).toBe(0);
    expect(effectiveStatus(cancelled, at(1))).toBe('Cancelled');
  });

  it('marks the current step and leaves future steps unreached', () => {
    const steps = trackingSteps(makeOrder(created), at(6));

    expect(steps).toHaveLength(5);
    expect(steps.find((step) => step.isCurrent)?.label).toBe('Packed');
    expect(steps[0].isComplete).toBe(true);
    expect(steps[4].reachedAt).toBeNull();
  });
});
