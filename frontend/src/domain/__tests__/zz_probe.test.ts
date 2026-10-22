import { describe, it } from 'vitest';
import { generateSmartGroceryPlan } from '@/domain/recommendations';
import { PRODUCTS } from '@/data/products';

describe('probe', () => {
  it('shows duplicates', () => {
    console.log(
      'products with secondary cats:\n  ' +
        PRODUCTS.filter((p) => p.secondaryCategories.length)
          .map((p) => `${p.name} [${p.category}] + ${p.secondaryCategories.join(',')}`)
          .join('\n  '),
    );
    const plan = generateSmartGroceryPlan(
      {
        peopleCount: 2,
        budget: 1500,
        durationDays: 7,
        dietType: 'Vegetarian',
        healthGoal: 'Maintain Weight',
        profileId: 1,
        usePantry: false,
      },
      [],
    );
    const ids = plan.lines.map((l) => l.productId);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    console.log('LINES:', plan.lines.length, 'DUPES:', JSON.stringify(dupes));
    const seen = new Set<number>();
    for (const l of plan.lines) {
      if (seen.has(l.productId)) console.log('DUPLICATE LINE:', l.productName, l.quantity);
      seen.add(l.productId);
    }
    console.log('total', plan.estimatedTotal);
  });
});
