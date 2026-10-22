import type { DietType, Id, MealSlot, DayOfWeek, NutritionFacts } from './common';
import type { PantryShortfall } from './pantry';

/** A single ingredient line of a recipe. */
export interface RecipeIngredient {
  productId: Id;
  /** Quantity required for the recipe's base servings. */
  quantity: number;
  unit: string;
  /** Normalised to g / ml / piece so pantry stock can be compared. */
  normalisedQuantity: number;
  normalisedUnit: 'g' | 'ml' | 'piece';
  optional: boolean;
  note: string;
}

export interface Recipe extends NutritionFacts {
  id: Id;
  code: string;
  name: string;
  description: string;
  image: string;
  /** Minutes of active prep/cook time. */
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  dietType: DietType;
  mealSlots: MealSlot[];
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Product codes of pantry-friendly swaps. */
  swapCodes: string[];
}

/** Result of comparing a recipe (or a merged weekly plan) against the pantry. */
export interface RecipePantryComparison {
  recipeId: Id;
  recipeName: string;
  hasPantryData: boolean;
  lines: PantryShortfall[];
  missingCount: number;
  /** Product id -> quantity that would be pushed to the cart. */
  cartAdditions: Array<{ productId: Id; quantity: number; name: string; unit: string }>;
}

export interface MealPlanItem {
  id: Id;
  mealPlanId: Id;
  day: DayOfWeek;
  slot: MealSlot;
  recipeId: Id;
  servings: number;
}

export interface MealPlan {
  id: Id;
  userId: Id;
  personProfileId: Id;
  weekStart: string;
  items: MealPlanItem[];
  createdAt: string;
}

export interface WeeklyRequirement {
  productId: Id;
  name: string;
  unit: string;
  requiredQuantity: number;
  availableQuantity: number;
  missingQuantity: number;
  cartQuantity: number;
  packSize: number;
  packUnit: string;
  estimatedPrice: number;
  coveredByPantry: boolean;
}

export interface WeeklyPlanSummary {
  weekStart: string;
  mealCount: number;
  requirements: WeeklyRequirement[];
  estimatedCost: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}
