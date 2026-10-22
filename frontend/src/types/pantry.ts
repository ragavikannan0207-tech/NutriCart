import type { Category, Id, IsoDate } from './common';

/**
 * A real (or user-declared) item sitting in the kitchen.
 * Pantry is intentionally separate from the cart: it represents stock on hand.
 */
export interface PantryItem {
  id: Id;
  userId: Id;
  personProfileId: Id;
  productId: Id | null;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  /** Grams / millilitres equivalent used when comparing against recipes. */
  normalisedQuantity: number;
  normalisedUnit: 'g' | 'ml' | 'piece';
  purchaseDate: IsoDate;
  expiryDate: IsoDate;
  /** True when expiry was derived from product type + purchase date instead of a printed date. */
  expiryEstimated: boolean;
  notes: string;
  createdAt: string;
}

export type PantryItemInput = Omit<
  PantryItem,
  'id' | 'userId' | 'normalisedQuantity' | 'normalisedUnit' | 'createdAt' | 'expiryEstimated'
> & { expiryEstimated?: boolean };

export interface PantryShortfall {
  productId: Id | null;
  name: string;
  requiredQuantity: number;
  requiredUnit: string;
  availableQuantity: number;
  availableUnit: string;
  missingQuantity: number;
  /** Quantity in the product's own pack size — what actually goes into the cart. */
  cartQuantity: number;
  isCovered: boolean;
}
