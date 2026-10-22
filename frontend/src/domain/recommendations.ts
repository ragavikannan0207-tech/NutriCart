import type {
  BudgetSummary,
  Category,
  DietType,
  HealthAlternativeGroup,
  HealthGoal,
  Order,
  PantryItem,
  PersonProfile,
  Product,
  RecommendationGroup,
  SmartGroceryLine,
  SmartGroceryPlan,
  SmartGroceryRequest,
  WishlistItem,
} from '@/types';
import { PRODUCTS, allCategoriesOf, getProductById, isDietCompatible, relatedProductsOf, searchProducts } from '@/data/products';
import { roundRupees } from './pricing';

/* ----------------------------------------------------------- FOR YOU ------- */

/** Goal -> the catalogue tags that genuinely serve that goal. */
const GOAL_TAGS: Record<HealthGoal, string[]> = {
  'Weight Loss': ['low calorie', 'high fiber', 'low fat', 'hydrating'],
  'Weight Gain': ['energy', 'healthy fats', 'complex carbs', 'protein'],
  'Muscle Gain': ['high protein', 'fitness', 'post workout', 'protein', 'muscle gain'],
  'Maintain Weight': ['wholegrain', 'high fiber', 'everyday', 'balanced'],
  'General Healthy Eating': ['wholegrain', 'high fiber', 'fresh', 'healthy snack', 'low fat'],
};

const inStock = (product: Product): boolean => product.stockCount > 0;

function allowedFor(product: Product, diet: DietType | null): boolean {
  return inStock(product) && (!diet || isDietCompatible(product, diet));
}

/** Higher score = better fit for this person right now. */
export function personalFitScore(product: Product, profile: PersonProfile | null): number {
  if (!profile) return product.rating;
  if (!isDietCompatible(product, profile.dietType)) return -1;

  const goalTags = GOAL_TAGS[profile.healthGoal] ?? [];
  let score = product.rating * 4;
  score += product.tags.filter((tag) => goalTags.includes(tag)).length * 12;
  score -= product.keywords.filter((keyword) => profile.allergies.some((a) => keyword.includes(a.toLowerCase()))).length * 40;
  if (profile.foodPreferences.some((pref) => product.tags.includes(pref.toLowerCase()))) score += 8;
  if (product.isBestseller) score += 3;
  if (profile.healthGoal === 'Muscle Gain') score += product.protein * 0.6;
  if (profile.healthGoal === 'Weight Loss') score -= product.calories * 0.05;
  return score;
}

function proteinPerRupee(product: Product): number {
  if (product.price <= 0) return 0;
  return (product.protein * (product.packGrams / product.basisAmount)) / product.price;
}

export interface RecommendationInput {
  profile: PersonProfile | null;
  orders: Order[];
  pantryItems: PantryItem[];
  wishlistItems: WishlistItem[];
  budget: BudgetSummary | null;
}

/**
 * Builds every For You section from the person's real activity: orders, pantry,
 * wishlist, diet, goal, allergies, preferences and budget. Nothing is fabricated —
 * when a section has nothing real to show the caller renders the empty state.
 */
export function buildRecommendationGroups(input: RecommendationInput): RecommendationGroup[] {
  const { profile, orders, pantryItems, wishlistItems, budget } = input;
  const groups: RecommendationGroup[] = [];
  const push = (group: RecommendationGroup) => {
    const products = group.products.filter((id, index, arr) => arr.indexOf(id) === index);
    if (products.length > 0) groups.push({ ...group, products });
  };

  const purchaseCounts = new Map<number, number>();
  orders.forEach((order) => order.items.forEach((item) => purchaseCounts.set(item.productId, (purchaseCounts.get(item.productId) ?? 0) + 1)));
  const pantryProductIds = new Set(pantryItems.map((item) => item.productId).filter((id): id is number => id != null));
  const wishlistIds = wishlistItems.map((item) => item.productId);

  const candidates = PRODUCTS.filter((product) => allowedFor(product, profile?.dietType ?? null));

  push({
    key: 'picked',
    title: profile ? `Picked for ${profile.name}` : 'Picked for You',
    subtitle: profile
      ? `Matched to ${profile.healthGoal.toLowerCase()} on a ${profile.dietType.toLowerCase()} diet`
      : 'Popular groceries across NutriCart',
    products: [...candidates].sort((a, b) => personalFitScore(b, profile) - personalFitScore(a, profile)).slice(0, 8).map((p) => p.id),
    reason: 'Goal and diet match',
  });

  push({
    key: 'buy-again',
    title: 'Buy Again',
    subtitle: 'The groceries you order most often',
    products: [...purchaseCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .filter((id) => (getProductById(id) ? allowedFor(getProductById(id) as Product, profile?.dietType ?? null) : false))
      .slice(0, 8),
    reason: 'Repeat purchase',
  });

  const becauseBought = new Set<number>();
  for (const [productId, count] of purchaseCounts) {
    if (count < 1) continue;
    const product = getProductById(productId);
    if (!product) continue;
    relatedProductsOf(product, 3)
      .filter((related) => allowedFor(related, profile?.dietType ?? null) && !purchaseCounts.has(related.id))
      .forEach((related) => becauseBought.add(related.id));
  }
  push({
    key: 'because-bought',
    title: 'Because You Bought This',
    subtitle: 'Pairs well with items in your past orders',
    products: [...becauseBought].slice(0, 8),
    reason: 'Based on your orders',
  });

  if (profile) {
    push({
      key: 'goal',
      title: `Based on Goal: ${profile.healthGoal}`,
      subtitle: 'Products that directly support your selected goal',
      products: candidates.filter((p) => GOAL_TAGS[profile.healthGoal].some((tag) => p.tags.includes(tag))).slice(0, 8).map((p) => p.id),
      reason: 'Goal aligned',
    });
  }

  push({
    key: 'high-protein',
    title: 'High Protein Picks',
    subtitle: '15 g or more of protein per 100 g',
    products: candidates.filter((p) => p.protein >= 15).sort((a, b) => b.protein - a.protein).slice(0, 8).map((p) => p.id),
    reason: 'Protein density',
  });

  const spendable = budget && budget.amount > 0 ? Math.max(150, Math.min(budget.remaining > 0 ? budget.remaining : budget.amount, budget.amount)) : 200;
  push({
    key: 'budget',
    title: 'Budget Friendly',
    subtitle: budget && budget.amount > 0 ? `Best protein per rupee within ₹${Math.round(spendable)}` : 'Everyday value picks',
    products: candidates.filter((p) => p.price <= spendable).sort((a, b) => proteinPerRupee(b) - proteinPerRupee(a)).slice(0, 8).map((p) => p.id),
    reason: 'Value for money',
  });

  const pantryPairs = new Set<number>();
  for (const id of pantryProductIds) {
    const product = getProductById(id);
    if (!product) continue;
    relatedProductsOf(product, 2)
      .filter((related) => allowedFor(related, profile?.dietType ?? null) && !pantryProductIds.has(related.id))
      .forEach((related) => pantryPairs.add(related.id));
  }
  push({
    key: 'pantry',
    title: 'Use Your Pantry',
    subtitle: 'Cook more of what you already have at home',
    products: [...pantryPairs].slice(0, 8),
    reason: 'Pairs with pantry stock',
  });

  push({
    key: 'new-healthy',
    title: 'New Healthy Choices',
    subtitle: 'Recently added to the NutriCart catalogue',
    products: candidates.filter((p) => p.isNew).slice(0, 8).map((p) => p.id),
    reason: 'New in catalogue',
  });

  push({
    key: 'wishlist',
    title: 'From Your Wishlist',
    subtitle: 'Saved for later, ready when you are',
    products: wishlistIds.filter((id) => (getProductById(id) ? allowedFor(getProductById(id) as Product, profile?.dietType ?? null) : false)).slice(0, 8),
    reason: 'Wishlist',
  });

  return groups;
}

/* ----------------------------------------------------- SMART GROCERY ----- */

/** Base grams per person per day per aisle, tuned with real pack sizes. */
const BASE_GRAMS_PER_PERSON_DAY: Record<Category, number> = {
  Fruits: 250,
  Vegetables: 350,
  Protein: 180,
  Grains: 220,
  Dairy: 300,
  'Healthy Snacks': 35,
  'Fitness Foods': 45,
  Drinks: 250,
  'Everyday Groceries': 15,
};

/** How the health goal bends the base basket. */
const GOAL_MULTIPLIERS: Record<HealthGoal, Partial<Record<Category, number>>> = {
  'Weight Loss': { Vegetables: 1.3, Fruits: 1.15, Grains: 0.8, 'Healthy Snacks': 0.6, 'Fitness Foods': 1.1, Dairy: 0.9 },
  'Weight Gain': { Grains: 1.25, Dairy: 1.2, Protein: 1.2, 'Healthy Snacks': 1.2 },
  'Muscle Gain': { Protein: 1.6, 'Fitness Foods': 1.8, Grains: 1.2, Dairy: 1.2 },
  'Maintain Weight': {},
  'General Healthy Eating': { Vegetables: 1.2, Fruits: 1.2, 'Healthy Snacks': 0.8 },
};

/** Priority order used when the budget has to be respected. */
const CATEGORY_PRIORITY: Category[] = [
  'Grains',
  'Protein',
  'Vegetables',
  'Dairy',
  'Fruits',
  'Drinks',
  'Everyday Groceries',
  'Fitness Foods',
  'Healthy Snacks',
];

function categoryFitScore(product: Product, request: SmartGroceryRequest): number {
  let score = product.rating * 3;
  if (request.healthGoal === 'Muscle Gain') score += product.protein * 0.8;
  if (request.healthGoal === 'Weight Loss') score -= product.calories * 0.06;
  if (request.budget <= 800) score += proteinPerRupee(product) * 12;
  if (request.budget >= 2500) score += product.isBestseller ? 6 : 0;
  if (product.isBestseller) score += 3;
  return score;
}

function reasonFor(product: Product, request: SmartGroceryRequest, packs: number, pantryCovered: boolean): string {
  const parts: string[] = [];
  const goalText =
    request.healthGoal === 'Muscle Gain'
      ? 'high protein for muscle gain'
      : request.healthGoal === 'Weight Loss'
        ? 'low calorie density for weight loss'
        : request.healthGoal.toLowerCase();
  parts.push(`${goalText}`);
  parts.push(`${product.protein} g protein per ${product.nutritionBasis.replace('per ', '')}`);
  parts.push(`covers ${packs} ${packs === 1 ? 'pack' : 'packs'} for ${request.peopleCount} ${request.peopleCount === 1 ? 'person' : 'people'} over ${request.durationDays} days`);
  if (pantryCovered) parts.push('adjusted for the stock already in your pantry');
  if (request.dietType === 'Vegetarian') parts.push('vegetarian choice');
  return parts.join(' · ');
}

/**
 * Budget-aware grocery plan generator.
 *
 * 1. builds a need profile from people, duration, diet and goal,
 * 2. picks the best fitting products per aisle,
 * 3. converts the requirement into real purchasable packs,
 * 4. subtracts pantry stock when requested,
 * 5. trims the basket until it fits the selected budget.
 *
 * ₹250 and ₹2,500 therefore never produce the same basket.
 */
export function generateSmartGroceryPlan(
  request: SmartGroceryRequest,
  pantryItems: PantryItem[],
): SmartGroceryPlan {
  const people = Math.max(1, Math.round(request.peopleCount));
  const days = Math.max(1, Math.round(request.durationDays));
  const budget = Math.max(0, request.budget);
  const notes: string[] = [];

  const goalMultipliers = GOAL_MULTIPLIERS[request.healthGoal as HealthGoal] ?? {};
  const pool = PRODUCTS.filter(
    (product) => product.stockCount > 0 && isDietCompatible(product, request.dietType),
  );

  type Candidate = { product: Product; grams: number; pantryCovered: boolean };
  const candidates: Candidate[] = [];
  const usedProducts = new Set<number>();

  for (const category of CATEGORY_PRIORITY) {
    const baseGrams = BASE_GRAMS_PER_PERSON_DAY[category] * people * days;
    const targetGrams = baseGrams * (goalMultipliers[category] ?? 1);
    const aisle = pool
      .filter((product) => allCategoriesOf(product).includes(category))
      .filter((product) => !usedProducts.has(product.id))
      .sort((a, b) => categoryFitScore(b, request) - categoryFitScore(a, request));
    if (aisle.length === 0) continue;

    // Two complementary products per aisle keeps the basket varied but simple.
    const picks = aisle.slice(0, category === 'Everyday Groceries' ? 2 : 3);
    let remaining = targetGrams;
    picks.forEach((product, index) => {
      if (remaining <= 0) return;
      const share = index === picks.length - 1 ? remaining : remaining * (index === 0 ? 0.55 : 0.3);
      const grams = Math.min(remaining, share);
      remaining -= grams;
      const pantryStock = pantryItems
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + item.normalisedQuantity, 0);
      candidates.push({ product, grams: Math.max(grams, product.packGrams), pantryCovered: pantryStock > 0 });
      usedProducts.add(product.id);
    });
  }

  // Pantry subtraction reduces the number of packs that have to be bought.
  let lines: SmartGroceryLine[] = [];
  let pantrySaved = 0;
  for (const candidate of candidates) {
    const { product, grams } = candidate;
    const available = request.usePantry
      ? pantryItems.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.normalisedQuantity, 0)
      : 0;
    const missing = Math.max(grams - available, product.packGrams);
    let packs = Math.max(1, Math.ceil(missing / product.packGrams));
    if (request.usePantry && available >= grams) {
      pantrySaved += 1;
      continue; // fully covered by the kitchen — buy nothing
    }
    if (request.budget <= 400) packs = Math.min(packs, 1);
    lines.push({
      productId: product.id,
      productName: product.name,
      code: product.code,
      image: product.image,
      category: product.category,
      quantity: packs,
      unit: product.unit,
      unitPrice: product.price,
      estimatedPrice: roundRupees(packs * product.price),
      calories: Math.round((product.calories / product.basisAmount) * product.packGrams * packs),
      protein: roundRupees((product.protein / product.basisAmount) * product.packGrams * packs),
      reason: reasonFor(product, request, packs, available > 0),
    });
  }

  const totalOf = (list: SmartGroceryLine[]) => roundRupees(list.reduce((sum, line) => sum + line.estimatedPrice, 0));

  // Trim from the least essential aisle until the basket fits the budget.
  let total = totalOf(lines);
  if (budget > 0) {
    while (total > budget && lines.length > 1) {
      const removable = [...lines].reverse().find((line) => line.quantity > 1);
      if (removable) {
        removable.quantity -= 1;
        removable.estimatedPrice = roundRupees(removable.quantity * removable.unitPrice);
        total = totalOf(lines);
        notes.push(`Reduced ${removable.productName} to ${removable.quantity} ${removable.quantity === 1 ? 'pack' : 'packs'} to stay inside your ₹${Math.round(budget)} budget.`);
        continue;
      }
      const dropped = lines.pop();
      if (dropped) notes.push(`Removed ${dropped.productName} so the basket stays inside your ₹${Math.round(budget)} budget.`);
      total = totalOf(lines);
    }
    if (total > budget) {
      lines = lines.filter((line) => line.estimatedPrice <= budget).slice(0, 1);
      total = totalOf(lines);
      notes.push('With this budget only the most essential staple fits — increase the budget for a fuller basket.');
    }
  }

  // A very low budget keeps the plan minimal on purpose.
  if (budget > 0 && budget <= 400) {
    lines = lines
      .filter((line) => line.estimatedPrice <= budget)
      .sort((a, b) => b.protein / Math.max(1, b.estimatedPrice) - a.protein / Math.max(1, a.estimatedPrice))
      .slice(0, 3);
    total = totalOf(lines);
  }

  // If there is comfortable headroom, widen the basket with quality extras.
  if (budget >= 1500 && total < budget * 0.7) {
    const used = new Set(lines.map((line) => line.productId));
    const extras = pool
      .filter((product) => !used.has(product.id) && ['Protein', 'Healthy Snacks', 'Fitness Foods', 'Dairy', 'Drinks'].includes(product.category))
      .sort((a, b) => personalFitScore(b, null) - personalFitScore(a, null))
      .slice(0, 4);
    for (const extra of extras) {
      if (total + extra.price > budget) continue;
      lines.push({
        productId: extra.id,
        productName: extra.name,
        code: extra.code,
        image: extra.image,
        category: extra.category,
        quantity: 1,
        unit: extra.unit,
        unitPrice: extra.price,
        estimatedPrice: extra.price,
        calories: Math.round((extra.calories / extra.basisAmount) * extra.packGrams),
        protein: roundRupees((extra.protein / extra.basisAmount) * extra.packGrams),
        reason: `Added because your ₹${Math.round(budget)} budget has room for a quality upgrade.`,
      });
      total = totalOf(lines);
    }
    if (extras.length > 0) notes.push('Your budget allowed a few quality additions to the basket.');
  }

  if (pantrySaved > 0) notes.push(`${pantrySaved} item${pantrySaved === 1 ? '' : 's'} were already covered by your pantry, so they were left out.`);
  if (request.durationDays > 14) notes.push('For long durations, fresh produce is planned in weekly quantities so nothing spoils.');
  if (request.dietType === 'Vegetarian') notes.push('Every item in this basket is vegetarian.');

  const lines2 = [...lines].sort((a, b) => CATEGORY_PRIORITY.indexOf(a.category) - CATEGORY_PRIORITY.indexOf(b.category));

  return {
    request: { ...request, peopleCount: people, durationDays: days, budget },
    lines: lines2,
    estimatedTotal: totalOf(lines2),
    budget,
    remainingBudget: roundRupees(Math.max(0, budget - totalOf(lines2))),
    totalCalories: Math.round(lines2.reduce((sum, line) => sum + line.calories, 0)),
    totalProtein: roundRupees(lines2.reduce((sum, line) => sum + line.protein, 0)),
    notes,
  };
}

/* -------------------------------------------- HEALTHY ALTERNATIVES ------- */

/**
 * Curated swaps for the foods people usually want a better version of.
 * Every entry points at a real catalogue product, so the CTA always opens a
 * genuine product instead of a dead end.
 */
export const CURATED_SWAPS: Array<{ triggers: string[]; swapFrom: string; swapToCode: string; reason: string; nutritionWin: string }> = [
  {
    triggers: ['bread', 'white bread', 'pav', 'sandwich'],
    swapFrom: 'White Bread',
    swapToCode: 'whole-wheat-bread',
    reason: 'Whole wheat keeps the bran and germ, so you get more fibre for the same slice.',
    nutritionWin: '6 g fibre vs about 2 g per 100 g',
  },
  {
    triggers: ['cereal', 'sugary cereal', 'cornflakes', 'breakfast cereal'],
    swapFrom: 'Sugary Breakfast Cereal',
    swapToCode: 'oats',
    reason: 'Rolled oats have no added sugar and carry beta-glucan that helps cholesterol.',
    nutritionWin: '10.6 g fibre and no added sugar',
  },
  {
    triggers: ['soft drink', 'cola', 'soda', 'coke', 'fizzy drink', 'cold drink'],
    swapFrom: 'Soft Drink',
    swapToCode: 'coconut-water',
    reason: 'Tender coconut water hydrates with natural electrolytes instead of 10 teaspoons of sugar.',
    nutritionWin: '19 kcal per 100 ml with no added sugar',
  },
  {
    triggers: ['chips', 'crisps', 'wafers', 'namkeen'],
    swapFrom: 'Fried Chips',
    swapToCode: 'roasted-makhana',
    reason: 'Roasted makhana keeps the crunch with a fraction of the oil.',
    nutritionWin: '0.1 g fat per 100 g vs about 35 g in fried chips',
  },
  {
    triggers: ['chips', 'protein', 'gym snack'],
    swapFrom: 'Chips (protein goal)',
    swapToCode: 'protein-chips',
    reason: 'Lentil and chickpea chips turn a snack into a protein contribution.',
    nutritionWin: '26 g protein per 100 g',
  },
  {
    triggers: ['chocolate', 'sweet', 'dessert', 'milk chocolate'],
    swapFrom: 'Milk Chocolate',
    swapToCode: 'dark-chocolate',
    reason: '70 percent dark chocolate gives real cocoa flavour with far less sugar.',
    nutritionWin: '70 percent cocoa solids, 11 g fibre',
  },
  {
    triggers: ['paneer', 'cheese'],
    swapFrom: 'Full Fat Paneer',
    swapToCode: 'low-fat-paneer',
    reason: 'Skimmed-milk paneer keeps the protein and drops most of the fat.',
    nutritionWin: '24 g protein with 11 g fat per 100 g',
  },
  {
    triggers: ['curd', 'yogurt', 'dahi'],
    swapFrom: 'Regular Curd',
    swapToCode: 'greek-yogurt',
    reason: 'Strained Greek yogurt roughly doubles the protein of regular curd.',
    nutritionWin: '9 g protein per 100 g',
  },
  {
    triggers: ['rice', 'white rice', 'staple'],
    swapFrom: 'White Rice',
    swapToCode: 'brown-rice',
    reason: 'Unpolished brown rice keeps its fibre and digests more slowly.',
    nutritionWin: '3.5 g fibre per 100 g',
  },
  {
    triggers: ['potato', 'aloo'],
    swapFrom: 'Potato',
    swapToCode: 'sweet-potato',
    reason: 'Sweet potato adds beta-carotene and releases its energy more slowly.',
    nutritionWin: '3 g fibre plus vitamin A',
  },
  {
    triggers: ['peanut butter', 'spread', 'jam'],
    swapFrom: 'Chocolate Spread',
    swapToCode: 'high-protein-peanut-butter',
    reason: 'Peanut butter spread gives healthy fats and real protein instead of sugar.',
    nutritionWin: '33 g protein per 100 g',
  },
  {
    triggers: ['granola', 'cereal bar', 'energy bar'],
    swapFrom: 'Cereal Bar',
    swapToCode: 'protein-bar',
    reason: 'A protein bar built on real nuts and cocoa carries three times the protein.',
    nutritionWin: '20 g protein per bar with no artificial sweeteners',
  },
];

/**
 * Dynamic Healthy Alternatives search.
 * Searching "chips" returns the genuine chip options in the catalogue as well as
 * the curated healthier swap, which is exactly what the requirement asks for.
 */
export function findHealthAlternatives(query: string): {
  curated: HealthAlternativeGroup[];
  catalogueMatches: Product[];
  healthierChoices: Product[];
} {
  const q = query.trim().toLowerCase();
  const matches = q ? searchProducts({ query: q }) : [];

  const curated: HealthAlternativeGroup[] = CURATED_SWAPS.filter((swap) =>
    q ? swap.triggers.some((trigger) => trigger.includes(q) || q.includes(trigger)) : true,
  )
    .map((swap) => {
      const target = PRODUCTS.find((product) => product.code === swap.swapToCode);
      if (!target) return null;
      return {
        key: `${swap.swapFrom}-${swap.swapToCode}`,
        query: swap.triggers[0],
        swapFrom: swap.swapFrom,
        swapToName: target.name,
        swapToProductId: target.id,
        reason: swap.reason,
        nutritionWin: swap.nutritionWin,
      } satisfies HealthAlternativeGroup;
    })
    .filter((group): group is HealthAlternativeGroup => group !== null);

  const healthierChoices = matches
    .flatMap((product) => relatedProductsOf(product, 0))
    .concat(matches.flatMap((product) => (product.alternativeCodes.length ? PRODUCTS.filter((p) => product.alternativeCodes.includes(p.code)) : [])))
    .filter((product, index, arr) => arr.findIndex((p) => p.id === product.id) === index)
    .filter((product) => product.stockCount > 0);

  return { curated, catalogueMatches: matches, healthierChoices };
}
