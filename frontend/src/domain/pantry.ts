import type {
  MealPlan,
  MealPlanItem,
  PantryItem,
  PantryShortfall,
  PantryStatus,
  Product,
  Recipe,
  RecipePantryComparison,
  WeeklyPlanSummary,
  WeeklyRequirement,
} from '@/types';
import { roundRupees } from './pricing';
import { addDays, daysBetween, startOfWeekIso, todayIso, weekStartOf } from './dates';

/**
 * Calendar-date helpers live in `./dates` so every surface (pantry, meal planner,
 * budget, budget periods) shares one timezone-safe implementation. They are
 * re-exported here because the pantry domain is the natural entry point for them.
 */
export { addDays, daysBetween, startOfWeekIso, todayIso, weekStartOf };

/**
 * Pantry rules.
 * Packaged goods carry the printed expiry date. Fresh produce in this catalogue
 * has no printed date, so its freshness is ESTIMATED from the product type and
 * the purchase date and is always labelled as an estimate in the UI.
 * Expired items are never deleted automatically — the user decides.
 */
export const SHELF_LIFE_DAYS: Record<string, number> = {
  'baby-spinach': 3,
  broccoli: 5,
  cucumber: 5,
  tomato: 5,
  capsicum: 6,
  'green-chilli': 8,
  papaya: 4,
  watermelon: 5,
  banana: 5,
  'hass-avocado': 4,
  sprouts: 3,
  curd: 4,
  buttermilk: 3,
  'low-fat-milk': 4,
  'protein-milkshake': 5,
  'coconut-water': 6,
  paneer: 5,
  'low-fat-paneer': 6,
  tofu: 6,
  'greek-yogurt': 7,
  'farm-fresh-eggs': 12,
  'whole-wheat-bread': 5,
  'multigrain-bread': 5,
  apple: 14,
  orange: 12,
  pomegranate: 12,
  kiwi: 8,
  'sweet-potato': 18,
  beetroot: 14,
  carrot: 12,
  onion: 21,
  potato: 21,
};

export const DEFAULT_SHELF_LIFE_DAYS = 30;
export const EXPIRING_SOON_DAYS = 3;

export function shelfLifeDaysFor(product: Product | undefined, name: string): number {
  if (product) return SHELF_LIFE_DAYS[product.code] ?? DEFAULT_SHELF_LIFE_DAYS;
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
  return SHELF_LIFE_DAYS[slug] ?? DEFAULT_SHELF_LIFE_DAYS;
}

/**
 * Calendar arithmetic on a YYYY-MM-DD date lives in `@/domain/dates`
 * (`addDays`, `todayIso`, `daysBetween`, `startOfWeekIso`) so that the pantry, the
 * meal planner and the budget all share one timezone-safe implementation.
 */

export interface FreshnessInfo {
  status: PantryStatus;
  daysRemaining: number;
  label: string;
  tone: 'fresh' | 'warning' | 'danger';
}

/** Fresh / Expiring Soon / Expired derived from the item's expiry date. */
export function freshnessOf(item: Pick<PantryItem, 'expiryDate'>, now: Date = new Date()): FreshnessInfo {
  const remaining = daysBetween(todayIso(now), item.expiryDate);
  if (remaining < 0) {
    return {
      status: 'Expired',
      daysRemaining: remaining,
      label: `Expired ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'} ago`,
      tone: 'danger',
    };
  }
  if (remaining === 0) return { status: 'Expiring Soon', daysRemaining: 0, label: 'Expires today', tone: 'warning' };
  if (remaining <= EXPIRING_SOON_DAYS) {
    return {
      status: 'Expiring Soon',
      daysRemaining: remaining,
      label: `${remaining} day${remaining === 1 ? '' : 's'} left`,
      tone: 'warning',
    };
  }
  return { status: 'Fresh', daysRemaining: remaining, label: `${remaining} days left`, tone: 'fresh' };
}

export function countByFreshness(items: PantryItem[], now: Date = new Date()) {
  return items.reduce(
    (acc, item) => {
      const { status } = freshnessOf(item, now);
      if (status === 'Fresh') acc.fresh += 1;
      else if (status === 'Expiring Soon') acc.expiring += 1;
      else acc.expired += 1;
      return acc;
    },
    { fresh: 0, expiring: 0, expired: 0 },
  );
}

/**
 * Compares a required quantity against pantry stock and returns ONLY what is
 * missing, expressed both in grams and in purchasable packs.
 */
export function compareRequirement(
  requirement: { productId: number; quantity: number; unit: string },
  product: Product | undefined,
  pantryItems: PantryItem[],
): PantryShortfall {
  const available = pantryItems
    .filter((item) => item.productId === requirement.productId)
    .reduce((sum, item) => sum + item.normalisedQuantity, 0);

  const missing = Math.max(0, requirement.quantity - available);
  const packSize = product?.packGrams ?? 0;
  const cartQuantity =
    missing <= 0 ? 0 : packSize > 0 ? Math.max(1, Math.ceil(missing / packSize)) : Math.ceil(missing);

  return {
    productId: requirement.productId,
    name: product?.name ?? 'Item',
    requiredQuantity: roundRupees(requirement.quantity),
    requiredUnit: requirement.unit,
    availableQuantity: roundRupees(available),
    availableUnit: requirement.unit,
    missingQuantity: roundRupees(missing),
    cartQuantity,
    isCovered: missing <= 0,
  };
}

/** Recipe vs pantry: which ingredients are short and exactly how much to buy. */
export function compareRecipeWithPantry(
  recipe: Recipe,
  pantryItems: PantryItem[],
  resolveProduct: (productId: number) => Product | undefined,
): RecipePantryComparison {
  const lines: PantryShortfall[] = recipe.ingredients.map((ingredient) =>
    compareRequirement(
      { productId: ingredient.productId, quantity: ingredient.normalisedQuantity, unit: ingredient.normalisedUnit },
      resolveProduct(ingredient.productId),
      pantryItems,
    ),
  );

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    hasPantryData: pantryItems.length > 0,
    lines,
    missingCount: lines.filter((line) => !line.isCovered).length,
    cartAdditions: lines
      .filter((line) => !line.isCovered && line.cartQuantity > 0 && line.productId != null)
      .map((line) => ({
        productId: line.productId as number,
        quantity: line.cartQuantity,
        name: line.name,
        unit: resolveProduct(line.productId as number)?.unit ?? line.requiredUnit,
      })),
  };
}

function pieceWeightOf(product: Product | undefined): number {
  if (!product || product.packSize <= 0) return 100;
  return product.packGrams / product.packSize;
}

/**
 * Meal planner -> weekly shopping list.
 * Aggregates every planned meal, merges duplicate ingredients, subtracts pantry
 * stock and returns only what still has to be bought.
 */
export function aggregateWeeklyRequirements(
  plan: MealPlan,
  resolveRecipe: (recipeId: number) => Recipe | undefined,
  pantryItems: PantryItem[],
  resolveProduct: (productId: number) => Product | undefined,
): WeeklyPlanSummary {
  const required = new Map<number, number>();

  for (const item of plan.items) {
    const recipe = resolveRecipe(item.recipeId);
    if (!recipe) continue;
    const scale = item.servings / Math.max(1, recipe.servings);
    for (const ingredient of recipe.ingredients) {
      const product = resolveProduct(ingredient.productId);
      const grams =
        ingredient.normalisedUnit === 'piece'
          ? ingredient.normalisedQuantity * scale * pieceWeightOf(product)
          : ingredient.normalisedQuantity * scale;
      required.set(ingredient.productId, roundRupees((required.get(ingredient.productId) ?? 0) + grams));
    }
  }

  const requirements: WeeklyRequirement[] = [];
  let estimatedCost = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  for (const [productId, requiredGrams] of required) {
    const product = resolveProduct(productId);
    if (!product) continue;
    const available = pantryItems
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.normalisedQuantity, 0);
    const missing = Math.max(0, requiredGrams - available);
    const packs = missing <= 0 ? 0 : Math.max(1, Math.ceil(missing / Math.max(1, product.packGrams)));

    estimatedCost += packs * product.price;
    totalCalories += (product.calories / product.basisAmount) * missing;
    totalProtein += (product.protein / product.basisAmount) * missing;
    totalCarbs += (product.carbs / product.basisAmount) * missing;
    totalFat += (product.fat / product.basisAmount) * missing;
    totalFiber += (product.fiber / product.basisAmount) * missing;

    requirements.push({
      productId,
      name: product.name,
      unit: product.unit,
      requiredQuantity: roundRupees(requiredGrams),
      availableQuantity: roundRupees(available),
      missingQuantity: roundRupees(missing),
      cartQuantity: packs,
      packSize: product.packSize,
      packUnit: product.packUnit,
      estimatedPrice: roundRupees(packs * product.price),
      coveredByPantry: missing <= 0,
    });
  }

  requirements.sort((a, b) => b.estimatedPrice - a.estimatedPrice || a.name.localeCompare(b.name));

  return {
    weekStart: plan.weekStart,
    mealCount: plan.items.length,
    requirements,
    estimatedCost: roundRupees(estimatedCost),
    totalCalories: Math.round(totalCalories),
    totalProtein: roundRupees(totalProtein),
    totalCarbs: roundRupees(totalCarbs),
    totalFat: roundRupees(totalFat),
    totalFiber: roundRupees(totalFiber),
  };
}

/** Current ISO week's Monday, used as the meal plan key. See `@/domain/dates`. */

export function mealPlanItemsOf(plan: MealPlan | null): MealPlanItem[] {
  return plan?.items ?? [];
}
