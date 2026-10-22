import type {
  ActivityLevel,
  BudgetPeriod,
  DietType,
  Gender,
  HealthGoal,
  Id,
  IsoDate,
  IsoDateTime,
} from './common';

/** A registered NutriCart account. One account owns many person profiles. */
export interface User {
  id: Id;
  fullName: string;
  email: string;
  createdAt: IsoDateTime;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * A person the account shops for (Ragavi, Mother, Father, Brother ...).
 * The active profile drives every personalised feature in NutriCart.
 */
export interface PersonProfile {
  id: Id;
  userId: Id;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietType: DietType;
  healthGoal: HealthGoal;
  /** Budget amount in ₹ for the profile's budget period. */
  budgetAmount: number;
  budgetPeriod: BudgetPeriod;
  allergies: string[];
  foodPreferences: string[];
  isActive: boolean;
  createdAt: IsoDateTime;
}

export type PersonProfileInput = Omit<PersonProfile, 'id' | 'userId' | 'createdAt'> & { isActive?: boolean };

export interface Address {
  id: Id;
  userId: Id;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'userId'>;

/** Daily nutrition targets derived from a person profile (Mifflin-St Jeor + activity + goal). */
export interface NutritionTargets {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  fiberTarget: number;
  bmi: number;
  bmiLabel: string;
}

export interface UserPreferences {
  /** Notification channels / topics toggled from Settings. */
  notifyOrderUpdates: boolean;
  notifyPantryExpiry: boolean;
  notifyBudgetAlerts: boolean;
  notifyRecommendations: boolean;
  notifyWeeklyPlan: boolean;
  nutritionPeriod: 'Daily' | 'Weekly' | 'Monthly';
  defaultPantryUnit: 'g' | 'kg' | 'piece';
  mealPreference: 'High Protein' | 'Balanced' | 'Low Carb' | 'Light';
  measurementSystem: 'Metric' | 'Imperial';
  currency: 'INR';
  lastPantryReview: IsoDate | null;
}
