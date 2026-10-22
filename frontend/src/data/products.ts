import type { Category, DietType, NutritionFacts, Product, ProductFilters, ProductSortKey } from '@/types';
import { DEFAULT_PRODUCT_FILTERS } from '@/types';
import { PRODUCE_SEED } from './seed/produce';
import { PROTEIN_SEED } from './seed/protein';
import { GRAINS_SEED } from './seed/grains';
import { SNACKS_SEED } from './seed/snacks';
import { FITNESS_DAIRY_SEED } from './seed/fitnessDairy';
import type { ProductSeed } from './seed/types';

export const PRODUCT_SEED: ProductSeed[] = [
  ...PRODUCE_SEED,
  ...PROTEIN_SEED,
  ...GRAINS_SEED,
  ...SNACKS_SEED,
  ...FITNESS_DAIRY_SEED,
];

/** Weight of one piece for products sold by count but nutrition-basis per 100 g. */
const PIECE_WEIGHT_GRAMS: Record<string, number> = {
  banana: 120,
  kiwi: 75,
  'farm-fresh-eggs': 50,
};

/**
 * A few items deliberately carry low stock so the Shop availability filter, the
 * "Low Stock" badge and the out-of-stock state are genuinely reachable.
 * Every other product gets a deterministic stock level derived from its id.
 */
const STOCK_OVERRIDES: Record<string, number> = {
  papaya: 0,
  watermelon: 0,
  'dark-chocolate': 8,
  'protein-chips': 9,
  'hass-avocado': 11,
};

const CATALOGUE_EPOCH = Date.UTC(2026, 0, 1);

/** Extracts the gram/ml amount that the nutrition numbers are quoted against. */
function resolveBasisAmount(seed: ProductSeed): number {
  if (seed.nutritionBasis.includes('per 100')) return 100;
  const match = seed.nutritionBasis.match(/\((\d+)\s*(g|ml)\)/);
  return match ? Number(match[1]) : 100;
}

/** Normalised pack weight in grams (ml is treated as grams). */
function resolvePackGrams(seed: ProductSeed): number {
  if (seed.packUnit === 'g' || seed.packUnit === 'ml') return seed.packSize;
  // Sold by piece: use the average piece weight when known, else 100 g.
  return (PIECE_WEIGHT_GRAMS[seed.code] ?? 100) * seed.packSize;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildProduct(seed: ProductSeed): Product {
  const basisAmount = resolveBasisAmount(seed);
  const packGrams = resolvePackGrams(seed);
  const scale = packGrams / basisAmount;
  const nutritionPerUnit: NutritionFacts = {
    calories: round1(seed.calories * scale),
    protein: round1(seed.protein * scale),
    carbs: round1(seed.carbs * scale),
    fat: round1(seed.fat * scale),
    fiber: round1(seed.fiber * scale),
  };
  const stockCount = STOCK_OVERRIDES[seed.code] ?? 30 + ((seed.id * 17) % 90);
  const availability: Product['availability'] =
    stockCount <= 0 ? 'Out of Stock' : stockCount <= 12 ? 'Low Stock' : 'In Stock';

  return {
    ...seed,
    secondaryCategories: seed.secondaryCategories ?? [],
    mrp: seed.mrp ?? seed.price,
    stockCount,
    availability,
    nutritionBasis: seed.nutritionBasis,
    basisAmount,
    nutritionPerUnit,
    packGrams,
    relatedCodes: seed.relatedCodes ?? [],
    alternativeCodes: seed.alternativeCodes ?? [],
    isNew: seed.isNew ?? false,
    isBestseller: seed.isBestseller ?? false,
    // Deterministic "added to catalogue" date so the Newest sort is stable.
    createdAt: new Date(CATALOGUE_EPOCH + seed.id * 86_400_000).toISOString(),
    image: `/products/${seed.code}.svg`,
  };
}

/** The ONE centralised NutriCart catalogue (56 unique SKUs / 63 catalogue slots). */
export const PRODUCTS: Product[] = PRODUCT_SEED.map(buildProduct).sort((a, b) => a.id - b.id);

export const CATEGORY_ORDER: Category[] = [
  'Fruits',
  'Vegetables',
  'Protein',
  'Grains',
  'Dairy',
  'Healthy Snacks',
  'Fitness Foods',
  'Drinks',
  'Everyday Groceries',
];

const byId = new Map<number, Product>(PRODUCTS.map((p) => [p.id, p]));
const byCode = new Map<string, Product>(PRODUCTS.map((p) => [p.code, p]));

export function getProductById(id: number | null | undefined): Product | undefined {
  return id == null ? undefined : byId.get(id);
}

export function getProductByCode(code: string): Product | undefined {
  return byCode.get(code);
}

export function getProductsByIds(ids: Array<number | null | undefined>): Product[] {
  return ids.map((id) => getProductById(id)).filter((p): p is Product => Boolean(p));
}

export function getProductsByCodes(codes: string[]): Product[] {
  return codes.map((code) => byCode.get(code)).filter((p): p is Product => Boolean(p));
}

/** Every category a product belongs to (primary first). */
export function allCategoriesOf(product: Product): Category[] {
  return [product.category, ...product.secondaryCategories];
}

/** True when a product fits the diet the shopper follows. */
export function isDietCompatible(product: Product, diet: DietType): boolean {
  if (diet === 'Vegetarian') return product.dietType === 'Vegetarian';
  return true; // Non-Vegetarian and No Restriction can buy everything
}

export function countByCategory(category: Category): number {
  return PRODUCTS.filter((p) => allCategoriesOf(p).includes(category)).length;
}

export const PRICE_BOUNDS = {
  min: 0,
  max: Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 50) * 50,
};

/* ------------------------------------------------------------------ SEARCH */

export interface ScoredProduct {
  product: Product;
  score: number;
}

/**
 * Case-insensitive, partial, multi-token search across product name, category,
 * tags and keywords. Returns a relevance score (0 = no match).
 */
export function scoreProduct(product: Product, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const tokens = q.split(/\s+/).filter(Boolean);

  const name = product.name.toLowerCase();
  const category = allCategoriesOf(product).join(' ').toLowerCase();
  const tags = product.tags.join(' ').toLowerCase();
  const keywords = product.keywords.join(' ').toLowerCase();
  const description = product.description.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    let tokenScore = 0;
    if (name === token) tokenScore = 120;
    else if (name.startsWith(token)) tokenScore = 100;
    else if (name.includes(token)) tokenScore = 80;
    else if (keywords.includes(token)) tokenScore = 65;
    else if (tags.includes(token)) tokenScore = 50;
    else if (category.includes(token)) tokenScore = 40;
    else if (description.includes(token)) tokenScore = 15;
    if (tokenScore === 0) return 0; // every token must match something
    score += tokenScore;
  }
  if (product.isBestseller) score += 4;
  if (product.stockCount > 0) score += 2;
  return score;
}

export interface SearchOptions {
  query?: string;
  filters?: Partial<ProductFilters>;
  sort?: ProductSortKey;
  /** Restrict results to products that the active profile's diet allows. */
  dietRestriction?: DietType;
  /** Hard limit on the number of returned rows. */
  limit?: number;
  /** Ids that must not appear in the result set. */
  excludeIds?: number[];
}

/** The single search + filter + sort implementation used by every page. */
export function searchProducts(options: SearchOptions = {}): Product[] {
  const { query = '', filters = {}, sort = 'relevance', dietRestriction, limit, excludeIds } = options;
  const f: ProductFilters = { ...DEFAULT_PRODUCT_FILTERS, ...filters };
  const excluded = new Set(excludeIds ?? []);

  let results: ScoredProduct[] = PRODUCTS.map((product) => ({ product, score: scoreProduct(product, query) }));

  if (query.trim()) results = results.filter((entry) => entry.score > 0);

  results = results.filter(({ product }) => {
    if (excluded.has(product.id)) return false;
    if (f.category !== 'All' && !allCategoriesOf(product).includes(f.category)) return false;
    if (f.diet !== 'All' && product.dietType !== f.diet) return false;
    if (f.maxPrice != null && product.price > f.maxPrice) return false;
    if (f.minProtein != null && product.protein < f.minProtein) return false;
    if (f.maxCalories != null && product.calories > f.maxCalories) return false;
    if (f.inStockOnly && product.stockCount <= 0) return false;
    if (dietRestriction && !isDietCompatible(product, dietRestriction)) return false;
    return true;
  });

  const products = sortProducts(results, sort).map((entry) => entry.product);
  return limit ? products.slice(0, limit) : products;
}

function sortProducts(entries: ScoredProduct[], sort: ProductSortKey): ScoredProduct[] {
  const list = [...entries];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.product.price - b.product.price || a.product.name.localeCompare(b.product.name));
    case 'price-desc':
      return list.sort((a, b) => b.product.price - a.product.price || a.product.name.localeCompare(b.product.name));
    case 'rating':
      return list.sort((a, b) => b.product.rating - a.product.rating || b.product.reviewCount - a.product.reviewCount);
    case 'newest':
      return list.sort((a, b) => b.product.createdAt.localeCompare(a.product.createdAt));
    case 'relevance':
    default:
      return list.sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.product.isBestseller) - Number(a.product.isBestseller) ||
          b.product.rating - a.product.rating,
      );
  }
}

/** All products belonging to an aisle (primary or secondary category). */
export function productsByCategory(category: Category): Product[] {
  return PRODUCTS.filter((product) => allCategoriesOf(product).includes(category));
}

/** Related products, excluding the product itself. */
export function relatedProductsOf(product: Product, limit = 4): Product[] {
  return getProductsByCodes(product.relatedCodes)
    .filter((p) => p.id !== product.id)
    .slice(0, limit);
}

/** Healthier alternatives, excluding the product itself. */
export function healthierAlternativesOf(product: Product, limit = 4): Product[] {
  return getProductsByCodes(product.alternativeCodes)
    .filter((p) => p.id !== product.id)
    .slice(0, limit);
}

