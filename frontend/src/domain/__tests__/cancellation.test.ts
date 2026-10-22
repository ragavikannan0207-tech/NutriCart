import { describe, expect, it } from 'vitest';
import {
  activeOrderOf,
  buildOrder,
  buildOrderNumber,
  cancellationState,
  nutritionForItems,
} from '../orders';
import { getProductById } from '@/data/products';
import type { Address, CartLine, Order, OrderItem, PersonProfile, User } from '@/types';

const CREATED = '2026-10-05T09:07:00.000Z';

const user: User = { id: 1, fullName: 'Verify Tester', email: 'verify.backend@gmail.com', createdAt: CREATED };
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
  foodPreferences: [],
  isActive: true,
  createdAt: CREATED,
};
const address: Address = {
  id: 1,
  userId: 1,
  label: 'Home',
  recipientName: 'Ragavi',
  phone: '9876543210',
  line1: '12 Green Park Street',
  line2: '',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600001',
  isDefault: true,
};
const cartLines: CartLine[] = [
  { productId: 3, quantity: 2, unitPrice: getProductById(3)?.price ?? 0, addedAt: CREATED },
];

const makeOrder = (createdAt = CREATED): Order =>
  buildOrder({
    id: 2,
    sequence: 2,
    user,
    person,
    address,
    cartLines,
    resolveProduct: getProductById,
    paymentMethod: 'COD',
    paymentReference: 'Cash on delivery',
    createdAt,
  });

describe('60 second cancellation window', () => {
  const order = makeOrder();
  const at = (seconds: number) => new Date(new Date(CREATED).getTime() + seconds * 1000);

  it('is open inside the window', () => {
    expect(cancellationState(order, at(0)).canCancel).toBe(true);
    expect(cancellationState(order, at(0)).remainingMs).toBe(60_000);
    expect(cancellationState(order, at(59)).canCancel).toBe(true);
  });

  it('is closed the moment the window passes — measured from createdAt, not a timer', () => {
    const state = cancellationState(order, at(61));
    expect(state.canCancel).toBe(false);
    expect(state.remainingMs).toBe(0);

    // A reload an hour later still refuses: the stored timestamp decides.
    expect(cancellationState(order, at(3600)).canCancel).toBe(false);
  });

  it('never offers cancellation for delivered or cancelled orders', () => {
    expect(cancellationState({ ...order, status: 'Cancelled' }, at(1)).canCancel).toBe(false);
    expect(cancellationState({ ...order, status: 'Delivered', deliveredAt: CREATED }, at(1)).canCancel).toBe(false);
  });

  it('builds the reference from the sequence and date', () => {
    expect(buildOrderNumber(7, new Date(Date.UTC(2026, 9, 5)))).toBe('NC-20261005-0007');
    expect(buildOrderNumber(7, new Date(Date.UTC(2026, 9, 5)))).toMatch(/^NC-\d{8}-\d{4}$/);
  });
});

describe('order aggregates', () => {
  it('sums nutrition from order items only (never invented)', () => {
    const items: OrderItem[] = [
      {
        productId: 1,
        code: 'x',
        name: 'x',
        image: '/x.svg',
        unit: 'unit',
        category: 'Fruits',
        unitPrice: 1,
        quantity: 2,
        lineTotal: 2,
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
        fiber: 3,
      },
    ];

    expect(nutritionForItems(items)).toEqual({
      calories: 200,
      protein: 20,
      carbs: 40,
      fat: 10,
      fiber: 6,
    });
    expect(nutritionForItems([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  });

  it('excludes nothing from history but picks the newest active order', () => {
    const delivered: Order = {
      ...makeOrder('2026-10-04T10:00:00.000Z'),
      id: 1,
      orderNumber: 'NC-20261004-0001',
      status: 'Delivered',
      deliveredAt: '2026-10-04T10:15:00.000Z',
    };
    const live: Order = { ...makeOrder('2026-10-05T11:00:00.000Z'), id: 2, orderNumber: 'NC-20261005-0002' };

    expect(activeOrderOf([delivered, live], new Date('2026-10-05T11:01:00.000Z'))?.id).toBe(2);
    // Once the live one is delivered there is no active order at all.
    expect(
      activeOrderOf([{ ...live, status: 'Delivered', deliveredAt: '2026-10-05T11:15:00Z' }, delivered], new Date('2026-10-05T11:20:00.000Z')),
    ).toBeUndefined();
  });

  it('keeps the COD payment reference free of card data', () => {
    expect(makeOrder().paymentReference).toBe('Cash on delivery');
    expect(JSON.stringify(makeOrder())).not.toMatch(/\d{13,}/);
  });
});

describe('reorder and reference helpers used by the UI', () => {
  it('returns product ids and quantities for the cart', () => {
    const order = makeOrder();
    const lines = order.items.map((item) => ({ productId: item.productId, quantity: item.quantity }));

    expect(lines).toEqual([{ productId: 3, quantity: 2 }]);
  });

  it('preserves the date stamp inside the reference', () => {
    // Month index 11 = December, so this is 31 Dec 2026.
    const reference = buildOrderNumber(1, new Date(Date.UTC(2026, 11, 31)));
    expect(reference.startsWith('NC-20261231-')).toBe(true);
  });
});
