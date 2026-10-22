/**
 * Shared primitives used across the NutriCart domain model.
 * These mirror the enums exposed by the Spring Boot REST API
 * (see backend/src/main/java/com/nutricart/domain/enums).
 */

export type Id = number;

/** Product categories used by the Shop, filters and Smart Grocery engine. */
export type Category =
  | 'Fruits'
  | 'Vegetables'
  | 'Protein'
  | 'Grains'
  | 'Dairy'
  | 'Healthy Snacks'
  | 'Fitness Foods'
  | 'Drinks'
  | 'Everyday Groceries';

export const CATEGORIES: Category[] = [
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

export type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'No Restriction';

export const DIET_TYPES: DietType[] = ['Vegetarian', 'Non-Vegetarian', 'No Restriction'];

export type Gender = 'Male' | 'Female' | 'Prefer not to say';

export const GENDERS: Gender[] = ['Male', 'Female', 'Prefer not to say'];

export type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active';

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
];

export type HealthGoal =
  | 'Weight Loss'
  | 'Weight Gain'
  | 'Muscle Gain'
  | 'Maintain Weight'
  | 'General Healthy Eating';

export const HEALTH_GOALS: HealthGoal[] = [
  'Weight Loss',
  'Weight Gain',
  'Muscle Gain',
  'Maintain Weight',
  'General Healthy Eating',
];

export type BudgetPeriod = 'Weekly' | 'Monthly';

export type OrderStatus = 'Confirmed' | 'Processing' | 'Packed' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Confirmed',
  'Processing',
  'Packed',
  'Out for Delivery',
  'Delivered',
];

export type PaymentMethod = 'COD' | 'UPI' | 'Card';

export type PantryStatus = 'Fresh' | 'Expiring Soon' | 'Expired';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner';

export const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner'];

export type NotificationType =
  | 'Order Confirmed'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Pantry Expiring'
  | 'Weekly Plan Ready'
  | 'Budget Warning'
  | 'Recommendation'
  | 'System';

export type NutritionPeriod = 'Daily' | 'Weekly' | 'Monthly';

export type VolumeUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'pack' | 'bunch' | 'dozen';

/** ISO-8601 date string, e.g. "2026-09-20". */
export type IsoDate = string;
/** ISO-8601 timestamp string, e.g. "2026-09-20T10:15:30.000Z". */
export type IsoDateTime = string;

export interface NutritionFacts {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface QuantityAmount {
  quantity: number;
  unit: string;
}

/** Normalised error surfaced by the API layer to the UI. */
export interface ApiErrorShape {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}
