import type { DietType, MealSlot } from '@/types';

/** Ingredient of a recipe, referenced by product code so the catalogue stays the single source of truth. */
export interface RecipeIngredientSeed {
  code: string;
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
  optional?: boolean;
  note?: string;
}

/**
 * Recipes are authored with raw ingredient quantities only — the nutrition on
 * every recipe card is COMPUTED from the real catalogue values of those
 * ingredients (see src/data/recipes.ts), never hand-written.
 */
export interface RecipeSeed {
  id: number;
  code: string;
  name: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  dietType: DietType;
  mealSlots: MealSlot[];
  tags: string[];
  steps: string[];
  ingredients: RecipeIngredientSeed[];
  swapCodes?: string[];
}
