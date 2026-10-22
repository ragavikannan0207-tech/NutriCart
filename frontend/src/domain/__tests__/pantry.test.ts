import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareRecipeWithPantry,
  compareRequirement,
  countByFreshness,
  daysBetween,
  freshnessOf,
  SHELF_LIFE_DAYS,
  shelfLifeDaysFor,
  startOfWeekIso,
} from '../pantry';
import { getProductById } from '@/data/products';
import { getRecipeById } from '@/data/recipes';
import type { PantryItem } from '@/types';

const NOW = new Date('2026-10-05T10:00:00.000Z');

const pantryItem = (overrides: Partial<PantryItem>): PantryItem => ({
  id: 1,
  userId: 1,
  personProfileId: 3,
  productId: 30,
  name: 'Brown Rice',
  category: 'Grains',
  quantity: 200,
  unit: 'g',
  normalisedQuantity: 200,
  normalisedUnit: 'g',
  purchaseDate: '2026-10-01',
  expiryDate: '2026-10-20',
  expiryEstimated: true,
  notes: '',
  createdAt: '2026-10-01T10:00:00Z',
  ...overrides,
});

describe('pantry freshness', () => {
  it('reports Fresh beyond the expiring-soon window', () => {
    const info = freshnessOf({ expiryDate: '2026-10-20' }, NOW);

    expect(info.status).toBe('Fresh');
    expect(info.daysRemaining).toBe(15);
    expect(info.tone).toBe('fresh');
  });

  it('reports Expiring Soon inside three days and today', () => {
    expect(freshnessOf({ expiryDate: '2026-10-08' }, NOW).status).toBe('Expiring Soon');
    expect(freshnessOf({ expiryDate: '2026-10-05' }, NOW).status).toBe('Expiring Soon'); // expires today
    expect(freshnessOf({ expiryDate: '2026-10-05' }, NOW).label).toBe('Expires today');
  });

  it('reports Expired with a label and never deletes the item', () => {
    const info = freshnessOf({ expiryDate: '2026-10-01' }, NOW);

    expect(info.status).toBe('Expired');
    expect(info.tone).toBe('danger');
    expect(info.label).toContain('Expired');
    expect(info.daysRemaining).toBe(-4);
  });

  it('counts each state for the pantry tiles', () => {
    const counts = countByFreshness(
      [
        pantryItem({ expiryDate: '2026-11-01' }),
        pantryItem({ expiryDate: '2026-10-07' }),
        pantryItem({ expiryDate: '2026-09-30' }),
      ],
      NOW,
    );

    expect(counts).toEqual({ fresh: 1, expiring: 1, expired: 1 });
  });

  it('estimates shelf life from the catalogue code, falling back to a default', () => {
    const spinach = getProductById(9);
    expect(shelfLifeDaysFor(spinach, 'Baby Spinach')).toBe(SHELF_LIFE_DAYS['baby-spinach']);
    expect(shelfLifeDaysFor(undefined, 'something unknown')).toBe(30);
    expect(shelfLifeDaysFor(undefined, 'Baby Spinach')).toBe(3); // name slug fallback
  });

  it('adds days and measures ranges without off-by-one drift', () => {
    expect(addDays('2026-10-05', 3)).toBe('2026-10-08');
    expect(daysBetween('2026-10-05', '2026-10-08')).toBe(3);
    expect(daysBetween('2026-10-08', '2026-10-05')).toBe(-3);
  });

  it('starts every meal-plan week on a Monday', () => {
    // 5 Oct 2026 is a Monday.
    expect(startOfWeekIso(NOW)).toBe('2026-10-05');
    expect(startOfWeekIso(new Date('2026-10-11T10:00:00.000Z'))).toBe('2026-10-05');
    expect(startOfWeekIso(new Date('2026-10-12T10:00:00.000Z'))).toBe('2026-10-12');
  });
});

describe('pantry vs requirement (what actually goes to the cart)', () => {
  it('treats a covered requirement as nothing to buy', () => {
    const shortfall = compareRequirement({ productId: 30, quantity: 200, unit: 'g' }, getProductById(30), [
      pantryItem({ normalisedQuantity: 500 }),
    ]);

    expect(shortfall.isCovered).toBe(true);
    expect(shortfall.missingQuantity).toBe(0);
    expect(shortfall.cartQuantity).toBe(0);
  });

  it('reports only the missing quantity, rounded up to purchasable packs', () => {
    const shortfall = compareRequirement({ productId: 30, quantity: 500, unit: 'g' }, getProductById(30), [
      pantryItem({ normalisedQuantity: 200 }),
    ]);

    expect(shortfall.isCovered).toBe(false);
    expect(shortfall.availableQuantity).toBe(200);
    expect(shortfall.missingQuantity).toBe(300);
    expect(shortfall.cartQuantity).toBe(1); // one 1 kg pack covers 300 g
  });

  it('never buys less than one pack when anything at all is missing', () => {
    const shortfall = compareRequirement({ productId: 30, quantity: 1200, unit: 'g' }, getProductById(30), [
      pantryItem({ normalisedQuantity: 100 }),
    ]);

    expect(shortfall.missingQuantity).toBe(1100);
    expect(shortfall.cartQuantity).toBe(2); // 1100 g → two 1 kg packs
  });

  it('compares a real recipe against the pantry and only adds the gaps', () => {
    const recipe = getRecipeById(2)!; // Vegetable Rice Bowl
    expect(recipe.ingredients.length).toBeGreaterThan(0);

    const recipeRice = recipe.ingredients.find((item) => item.productId === 30)!;
    expect(recipeRice.normalisedQuantity).toBe(120); // 120 g of brown rice for 2 servings

    // Only 50 g is left in the kitchen, so 70 g is genuinely missing.
    const comparison = compareRecipeWithPantry(
      recipe,
      [pantryItem({ productId: 30, normalisedQuantity: 50 })],
      getProductById,
    );

    expect(comparison.recipeId).toBe(recipe.id);
    expect(comparison.hasPantryData).toBe(true);

    const rice = comparison.lines.find((line) => line.productId === 30)!;
    expect(rice.availableQuantity).toBe(50);
    expect(rice.missingQuantity).toBe(70);
    expect(rice.isCovered).toBe(false);
    expect(rice.cartQuantity).toBe(1); // one 1 kg pack covers the 70 g gap

    // Everything short of stock is queued for the cart with a whole number of packs.
    for (const addition of comparison.cartAdditions) {
      expect(addition.quantity).toBeGreaterThan(0);
      expect(getProductById(addition.productId)).toBeDefined();
    }
    expect(comparison.missingCount).toBe(comparison.lines.filter((line) => !line.isCovered).length);
  });

  it('adds nothing to the cart when the pantry already covers the recipe', () => {
    const recipe = getRecipeById(2)!;

    const comparison = compareRecipeWithPantry(
      recipe,
      // Generous stock for every ingredient of the recipe.
      recipe.ingredients.map((ingredient) =>
        pantryItem({
          productId: ingredient.productId,
          normalisedQuantity: ingredient.normalisedQuantity * 2,
        }),
      ),
      getProductById,
    );

    expect(comparison.missingCount).toBe(0);
    expect(comparison.cartAdditions).toHaveLength(0);
  });
});
