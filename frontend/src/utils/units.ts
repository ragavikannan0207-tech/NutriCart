import type { PantryItem, Product, RecipeIngredient } from '@/types';

/**
 * Unit handling for the pantry / recipe / meal-planner maths.
 * g and ml are treated as equivalent weight units (1 ml ≈ 1 g) which is the
 * convention used across NutriCart when comparing recipe requirements with
 * kitchen stock.
 */

export type NormalisedUnit = 'g' | 'ml' | 'piece';

export interface NormalisedQuantity {
  quantity: number;
  unit: NormalisedUnit;
}

const MASS_FACTORS: Record<string, number> = {
  g: 1,
  gm: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  litre: 1000,
  liter: 1000,
};

/** Average weight of one piece for count-based products. */
export function pieceWeight(product: Product): number {
  return product.packSize > 0 ? product.packGrams / product.packSize : 100;
}

/**
 * Converts any quantity/unit pair into the canonical g / ml / piece form.
 */
export function normaliseQuantity(quantity: number, unit: string, product?: Product): NormalisedQuantity {
  const clean = unit.trim().toLowerCase();
  if (clean === 'piece' || clean === 'pieces' || clean === 'pcs' || clean === 'nos') {
    return { quantity, unit: 'piece' };
  }
  const factor = MASS_FACTORS[clean];
  if (factor) {
    // Liquids are stored as ml, everything else as g.
    const isLiquid = clean === 'ml' || clean === 'l' || clean === 'litre' || clean === 'liter';
    return { quantity: quantity * factor, unit: isLiquid ? 'ml' : 'g' };
  }
  // Unknown unit: fall back to grams using the product's pack weight.
  return { quantity, unit: product?.packUnit === 'ml' ? 'ml' : 'g' };
}

/** Converts a quantity expressed in g/ml/piece into grams for comparison. */
export function toGrams(normalised: NormalisedQuantity, product?: Product): number {
  if (normalised.unit === 'piece') {
    const weight = product ? pieceWeight(product) : 100;
    return normalised.quantity * weight;
  }
  return normalised.quantity;
}

/** Converts grams back into the most readable pantry-friendly unit. */
export function gramsToDisplay(grams: number, product?: Product): NormalisedQuantity {
  if (product && product.packUnit === 'ml') {
    return grams >= 1000 ? { quantity: round2(grams / 1000), unit: 'ml' } : { quantity: round2(grams), unit: 'ml' };
  }
  if (grams >= 1000) return { quantity: round2(grams / 1000), unit: 'g' };
  return { quantity: round2(grams), unit: 'g' };
}

/** Normalised requirement of a recipe ingredient (base servings). */
export function ingredientNormalised(ingredient: RecipeIngredient): NormalisedQuantity {
  return { quantity: ingredient.normalisedQuantity, unit: ingredient.normalisedUnit };
}

/** Normalised amount of stock in the pantry. */
export function pantryNormalised(item: PantryItem): NormalisedQuantity {
  return { quantity: item.normalisedQuantity, unit: item.normalisedUnit };
}

/** Grams in the cart for a given number of product packs. */
export function packsToGrams(packs: number, product: Product): number {
  return packs * product.packGrams;
}

/** How many packs are needed to cover a gram requirement. */
export function gramsToPacks(grams: number, product: Product): number {
  if (product.packGrams <= 0) return Math.max(1, Math.ceil(grams));
  return Math.max(1, Math.ceil(grams / product.packGrams));
}

/** 500 -> "500 g", 1500 -> "1.5 kg", 2000 ml -> "2 l" */
export function formatQuantity(quantity: number, unit: string): string {
  const rounded = round2(quantity);
  if (unit === 'g' || unit === 'ml') {
    if (rounded >= 1000) {
      const converted = round2(rounded / 1000);
      return unit === 'g' ? `${converted} kg` : `${converted} l`;
    }
    return `${rounded} ${unit}`;
  }
  const plural = rounded === 1 ? 'piece' : 'pieces';
  return `${rounded} ${plural}`;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
