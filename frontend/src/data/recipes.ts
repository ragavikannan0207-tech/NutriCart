import type { NutritionFacts, Recipe, RecipeIngredient } from '@/types';
import { PRODUCTS, getProductByCode } from './products';
import { RECIPES_CORE_SEED } from './seed/recipesCore';
import { RECIPES_EXTRA_SEED } from './seed/recipesExtra';
import type { RecipeSeed } from './seed/recipeTypes';

export const RECIPE_SEED: RecipeSeed[] = [...RECIPES_CORE_SEED, ...RECIPES_EXTRA_SEED];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Nutrition per gram/ml derived from the product's own per-100 g values. */
function nutritionPerGram(product: NutritionSource) {
  const factor = 1 / product.basisAmount;
  return {
    calories: product.calories * factor,
    protein: product.protein * factor,
    carbs: product.carbs * factor,
    fat: product.fat * factor,
    fiber: product.fiber * factor,
  };
}

interface NutritionSource extends NutritionFacts {
  basisAmount: number;
  packGrams: number;
  packSize: number;
}

/** Weight in grams that one recipe ingredient represents. */
function ingredientGrams(quantity: number, unit: RecipeIngredient['normalisedUnit'], gramsPerPiece: number): number {
  return unit === 'piece' ? quantity * gramsPerPiece : quantity;
}

function buildRecipe(seed: RecipeSeed): Recipe {
  const ingredients: RecipeIngredient[] = [];
  const totals: NutritionFacts = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  for (const ingredientSeed of seed.ingredients) {
    const product = getProductByCode(ingredientSeed.code);
    if (!product) {
      throw new Error(`Recipe "${seed.code}" references unknown product code "${ingredientSeed.code}"`);
    }
    const normalisedUnit: RecipeIngredient['normalisedUnit'] =
      ingredientSeed.unit === 'piece' ? 'piece' : product.packUnit === 'ml' ? 'ml' : 'g';

    ingredients.push({
      productId: product.id,
      quantity: ingredientSeed.quantity,
      unit: ingredientSeed.unit,
      normalisedQuantity: ingredientSeed.quantity,
      normalisedUnit,
      optional: ingredientSeed.optional ?? false,
      note: ingredientSeed.note ?? '',
    });

    const gramsPerPiece = product.packSize > 0 ? product.packGrams / product.packSize : 100;
    const perGram = nutritionPerGram(product);
    const grams = ingredientGrams(ingredientSeed.quantity, normalisedUnit, gramsPerPiece);
    totals.calories += perGram.calories * grams;
    totals.protein += perGram.protein * grams;
    totals.carbs += perGram.carbs * grams;
    totals.fat += perGram.fat * grams;
    totals.fiber += perGram.fiber * grams;
  }

  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    description: seed.description,
    image: `/recipes/${seed.code}.svg`,
    prepTimeMinutes: seed.prepTimeMinutes,
    cookTimeMinutes: seed.cookTimeMinutes,
    servings: seed.servings,
    dietType: seed.dietType,
    mealSlots: seed.mealSlots,
    tags: seed.tags,
    ingredients,
    steps: seed.steps,
    swapCodes: seed.swapCodes ?? [],
    calories: round1(totals.calories),
    protein: round1(totals.protein),
    carbs: round1(totals.carbs),
    fat: round1(totals.fat),
    fiber: round1(totals.fiber),
  };
}

/** The single recipe catalogue; nutrition is computed from the catalogue, never hand-written. */
export const RECIPES: Recipe[] = RECIPE_SEED.map(buildRecipe).sort((a, b) => a.id - b.id);

const recipesById = new Map<number, Recipe>(RECIPES.map((recipe) => [recipe.id, recipe]));
const productsById = new Map<number, (typeof PRODUCTS)[number]>(PRODUCTS.map((product) => [product.id, product]));

export function getRecipeById(id: number | null | undefined): Recipe | undefined {
  return id == null ? undefined : recipesById.get(id);
}

export function getRecipeByCode(code: string): Recipe | undefined {
  return RECIPES.find((recipe) => recipe.code === code);
}

/** Total minutes a recipe takes including prep. */
export function totalMinutes(recipe: Recipe): number {
  return recipe.prepTimeMinutes + recipe.cookTimeMinutes;
}

/** Ingredients of a recipe resolved to full catalogue products. */
export function recipeProducts(recipe: Recipe) {
  return recipe.ingredients
    .map((ingredient) => productsById.get(ingredient.productId))
    .filter((product): product is (typeof PRODUCTS)[number] => Boolean(product));
}

export interface RecipeSearchOptions {
  query?: string;
  mealSlot?: string;
  dietType?: string;
  maxMinutes?: number;
  tags?: string[];
}

/** Case-insensitive recipe search across name, description, tags and ingredients. */
export function searchRecipes(options: RecipeSearchOptions = {}): Recipe[] {
  const { query = '', mealSlot, dietType, maxMinutes, tags } = options;
  const q = query.trim().toLowerCase();
  return RECIPES.filter((recipe) => {
    if (mealSlot && !recipe.mealSlots.includes(mealSlot as Recipe['mealSlots'][number])) return false;
    if (dietType && dietType !== 'All' && recipe.dietType !== dietType) return false;
    if (maxMinutes != null && totalMinutes(recipe) > maxMinutes) return false;
    if (tags?.length && !tags.some((tag) => recipe.tags.includes(tag))) return false;
    if (!q) return true;
    const ingredientNames = recipe.ingredients
      .map((ingredient) => productsById.get(ingredient.productId)?.name ?? '')
      .join(' ');
    const haystack = [recipe.name, recipe.description, recipe.dietType, recipe.mealSlots.join(' '), recipe.tags.join(' '), ingredientNames]
      .join(' ')
      .toLowerCase();
    return q.split(/\s+/).every((token) => haystack.includes(token));
  });
}
