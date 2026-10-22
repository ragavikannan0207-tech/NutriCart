import type { Category, DietType, Id, NutritionFacts } from './common';

/**
 * A grocery product from the single centralised NutriCart catalogue.
 * The catalogue is defined once in src/data/products.ts and is also seeded
 * into MySQL (database/seed_products.sql / backend data.sql).
 */
export interface Product extends NutritionFacts {
  id: Id;
  /** Stable slug used for the generated product artwork and API lookups. */
  code: string;
  name: string;
  /** Primary category shown on cards and used by the Shop filters. */
  category: Category;
  /** Additional categories (e.g. Protein Oats is both Grains and Fitness Foods). */
  secondaryCategories: Category[];
  price: number;
  /** Original price used to display a genuine "save ₹x" only when > price. */
  mrp: number;
  unit: string;
  /** Normalised pack weight in grams/ml — used by recipes + pantry maths. */
  packSize: number;
  packUnit: 'g' | 'ml' | 'piece';
  image: string;
  description: string;
  rating: number;
  reviewCount: number;
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockCount: number;
  dietType: DietType;
  /** Human readable statement of what the nutrition numbers describe. */
  nutritionBasis: string;
  /** Grams / millilitres that the nutrition numbers are quoted against. */
  basisAmount: number;
  /** Nutrition contained in one purchased unit (pack) of this product. */
  nutritionPerUnit: NutritionFacts;
  /** Normalised weight of one pack in grams (ml treated as grams) for pantry maths. */
  packGrams: number;
  tags: string[];
  keywords: string[];
  healthyBenefits: string[];
  /** Product codes of related products (same aisle / complementary). */
  relatedCodes: string[];
  /** Product codes of genuinely healthier alternatives. */
  alternativeCodes: string[];
  createdAt: string;
  isNew: boolean;
  isBestseller: boolean;
}

export type ProductSortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export interface ProductFilters {
  category: Category | 'All';
  diet: DietType | 'All';
  /** Price ceiling in ₹. */
  maxPrice: number | null;
  /** Minimum protein in grams per 100g/ml serving. */
  minProtein: number | null;
  /** Maximum calories per serving. */
  maxCalories: number | null;
  inStockOnly: boolean;
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  category: 'All',
  diet: 'All',
  maxPrice: null,
  minProtein: null,
  maxCalories: null,
  inStockOnly: false,
};

export interface SmartGroceryRequest {
  peopleCount: number;
  budget: number;
  durationDays: number;
  dietType: DietType;
  healthGoal: string;
  profileId: Id;
  usePantry: boolean;
}

export interface SmartGroceryLine {
  productId: Id;
  productName: string;
  code: string;
  image: string;
  category: Category;
  quantity: number;
  unit: string;
  unitPrice: number;
  estimatedPrice: number;
  calories: number;
  protein: number;
  reason: string;
}

export interface SmartGroceryPlan {
  request: SmartGroceryRequest;
  lines: SmartGroceryLine[];
  estimatedTotal: number;
  budget: number;
  remainingBudget: number;
  totalCalories: number;
  totalProtein: number;
  notes: string[];
}
