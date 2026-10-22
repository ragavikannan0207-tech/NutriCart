import { describe, expect, it } from 'vitest';
import { discountPercentFor, priceCart, priceStoredSubtotal, PRICING } from '../pricing';
import { getProductById } from '@/data/products';
import type { CartLine } from '@/types';

const line = (productId: number, quantity: number): CartLine => ({
  productId,
  quantity,
  unitPrice: getProductById(productId)?.price ?? 0,
  addedAt: new Date().toISOString(),
});

describe('NutriCart pricing engine', () => {
  it('matches the price the backend charged for the same basket', () => {
    // Paneer 4 × ₹95 + Avocado 2 × ₹249 + Brown Rice 1 × ₹110 = ₹988.
    // The identical basket was placed against MySQL and returned
    // subtotal 988, delivery 0, GST 49.40, total 1037.40 — browser and DB must agree.
    const { totals, lines } = priceCart([line(20, 4), line(1, 2), line(30, 1)], getProductById);

    expect(lines).toHaveLength(3);
    expect(totals.itemCount).toBe(7);
    expect(totals.subtotal).toBe(988);
    expect(totals.delivery).toBe(0); // ≥ ₹499 free delivery
    expect(totals.discount).toBe(0); // < ₹1,500
    expect(totals.tax).toBe(49.4); // 5% of 988
    expect(totals.grandTotal).toBe(1037.4);
    expect(totals.grandTotal).toBe(
      totals.subtotal - totals.discount + totals.delivery + totals.tax,
    );
  });

  it('charges delivery below the ₹499 threshold', () => {
    const { totals } = priceCart([line(3, 1)], getProductById); // banana ₹60

    expect(totals.subtotal).toBe(60);
    expect(totals.delivery).toBe(PRICING.deliveryFee);
    expect(totals.tax).toBe(3); // 5% of 60
    expect(totals.grandTotal).toBe(102);
    expect(totals.freeDeliveryRemaining).toBe(439);
  });

  it('applies the 5% and 8% quantity discount tiers before GST', () => {
    expect(discountPercentFor(499)).toBe(0);
    expect(discountPercentFor(1499)).toBe(0);
    expect(discountPercentFor(1500)).toBe(5);
    expect(discountPercentFor(2499)).toBe(5);
    expect(discountPercentFor(2500)).toBe(8);
  });

  it('prices a stored subtotal identically (invoice re-quote)', () => {
    const priced = priceStoredSubtotal({ subtotal: 2600 });

    expect(priced.discount).toBe(208); // 8%
    expect(priced.delivery).toBe(0); // ≥ ₹499
    expect(priced.tax).toBe(119.6); // 5% of (2600 − 208)
    expect(priced.grandTotal).toBe(2511.6);
  });

  it('ignores unknown products and zero quantities instead of breaking', () => {
    const { totals, lines } = priceCart(
      [{ productId: 9999, quantity: 5, unitPrice: 0, addedAt: '' }, line(3, 0), line(3, 2)],
      getProductById,
    );

    expect(lines).toHaveLength(1);
    expect(totals.itemCount).toBe(2);
    expect(totals.subtotal).toBe(120);
  });
});

describe('catalogue integrity', () => {
  it('loads 56 unique products across nine aisles', () => {
    const ids = new Set<number>();
    for (const id of Array.from({ length: 120 }, (_, index) => index + 1)) {
      if (getProductById(id)) ids.add(id);
    }
    expect(ids.size).toBe(56);
  });

  it('resolves the code-linked product used by recipes and pantry', () => {
    expect(getProductById(30)?.name).toContain('Brown Rice');
    expect(getProductById(30)?.packGrams).toBe(1000);
    expect(getProductById(1)?.nutritionPerUnit.calories).toBe(480); // 160 kcal/100 g × 300 g
  });
});
