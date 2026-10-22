import type { CartLine, CartTotals, CartLineView, Product } from '@/types';

/**
 * The single pricing engine of NutriCart.
 * The Java backend re-implements exactly these rules in PricingService so the
 * totals the customer sees are identical to the totals stored in MySQL.
 */
export const PRICING = {
  /** Orders at or above this subtotal ship free. */
  freeDeliveryThreshold: 499,
  /** Flat delivery fee below the free-delivery threshold. */
  deliveryFee: 39,
  /** GST applied to the discounted subtotal. */
  taxRate: 0.05,
  /** Order-value discounts, highest tier first. */
  discountTiers: [
    { minSubtotal: 2500, percent: 8 },
    { minSubtotal: 1500, percent: 5 },
  ],
  /** Nutrition label disclaimer shared by every nutrition surface. */
  nutritionDisclaimer:
    'Nutrition shown is that of the groceries purchased, calculated from the product values and the quantity bought. It is not a record of what was eaten.',
} as const;

export function roundRupees(value: number): number {
  return Math.round(value * 100) / 100;
}

export function lineTotal(line: Pick<CartLine, 'unitPrice' | 'quantity'>): number {
  return roundRupees(line.unitPrice * line.quantity);
}

/** Discount percentage that applies to a given subtotal (0 when no tier is met). */
export function discountPercentFor(subtotal: number): number {
  const tier = PRICING.discountTiers.find((entry) => subtotal >= entry.minSubtotal);
  return tier?.percent ?? 0;
}

export interface PricedCart {
  lines: CartLineView[];
  totals: CartTotals;
}

/**
 * Prices a cart: subtotal → quantity discount → delivery → GST.
 * Line views include a live stock check so the UI can warn about stock changes.
 */
export function priceCart(
  lines: CartLine[],
  resolveProduct: (productId: number) => Product | undefined,
): PricedCart {
  const views: CartLineView[] = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const line of lines) {
    const product = resolveProduct(line.productId);
    if (!product || line.quantity <= 0) continue;
    const total = lineTotal({ unitPrice: product.price, quantity: line.quantity });
    subtotal += total;
    itemCount += line.quantity;
    views.push({
      productId: product.id,
      name: product.name,
      code: product.code,
      image: product.image,
      unit: product.unit,
      category: product.category,
      unitPrice: product.price,
      quantity: line.quantity,
      lineTotal: total,
      availability: product.availability,
      stockCount: product.stockCount,
    });
  }

  subtotal = roundRupees(subtotal);
  const discountPercent = discountPercentFor(subtotal);
  const discount = roundRupees((subtotal * discountPercent) / 100);
  const taxable = subtotal - discount;
  const delivery = views.length === 0 || subtotal >= PRICING.freeDeliveryThreshold ? 0 : PRICING.deliveryFee;
  const tax = roundRupees(taxable * PRICING.taxRate);
  const grandTotal = roundRupees(taxable + delivery + tax);

  return {
    lines: views,
    totals: {
      subtotal,
      delivery,
      tax,
      discount,
      grandTotal,
      itemCount,
      freeDeliveryThreshold: PRICING.freeDeliveryThreshold,
      freeDeliveryRemaining: Math.max(0, roundRupees(PRICING.freeDeliveryThreshold - subtotal)),
      discountPercent,
    },
  };
}

export interface OrderPricingInput {
  subtotal: number;
  discount?: number;
  delivery?: number;
}

/** Recomputes the delivery fee + GST for a stored subtotal (invoice / re-quote). */
export function priceStoredSubtotal({ subtotal, discount, delivery }: OrderPricingInput): Omit<CartTotals, 'itemCount' | 'freeDeliveryThreshold' | 'freeDeliveryRemaining' | 'discountPercent'> {
  const appliedDiscount = discount ?? roundRupees((subtotal * discountPercentFor(subtotal)) / 100);
  const appliedDelivery = delivery ?? (subtotal >= PRICING.freeDeliveryThreshold ? 0 : PRICING.deliveryFee);
  const taxable = subtotal - appliedDiscount;
  const tax = roundRupees(taxable * PRICING.taxRate);
  return {
    subtotal: roundRupees(subtotal),
    delivery: roundRupees(appliedDelivery),
    tax,
    discount: roundRupees(appliedDiscount),
    grandTotal: roundRupees(taxable + appliedDelivery + tax),
  };
}
