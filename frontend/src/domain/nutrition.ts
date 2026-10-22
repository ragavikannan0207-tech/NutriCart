import type {
  Budget,
  BudgetPeriod,
  BudgetSummary,
  Category,
  CategorySpend,
  NutritionFacts,
  NutritionTargets,
  Order,
  PersonProfile,
  PurchasedNutritionSummary,
} from '@/types';
import { effectiveStatus, nutritionForItems } from './orders';
import { roundRupees } from './pricing';
import { todayIso } from './pantry';

export const EMPTY_NUTRITION: NutritionFacts = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

const ACTIVITY_FACTORS: Record<PersonProfile['activityLevel'], number> = {
  Sedentary: 1.2,
  'Lightly Active': 1.375,
  'Moderately Active': 1.55,
  'Very Active': 1.725,
};

const GOAL_CALORIE_ADJUSTMENT: Record<PersonProfile['healthGoal'], number> = {
  'Weight Loss': -0.18,
  'Weight Gain': 0.15,
  'Muscle Gain': 0.1,
  'Maintain Weight': 0,
  'General Healthy Eating': 0,
};

const GOAL_PROTEIN_PER_KG: Record<PersonProfile['healthGoal'], number> = {
  'Weight Loss': 1.6,
  'Weight Gain': 1.6,
  'Muscle Gain': 2.0,
  'Maintain Weight': 1.2,
  'General Healthy Eating': 1.1,
};

/**
 * Daily nutrition targets from the active person profile.
 * Basal metabolic rate uses Mifflin-St Jeor, scaled by the activity factor and
 * adjusted for the selected health goal. These are guidance targets, not medical
 * advice, and are labelled as such in the UI.
 */
export function computeNutritionTargets(profile: PersonProfile): NutritionTargets {
  const { weightKg, heightCm, age, gender, activityLevel, healthGoal } = profile;
  const genderOffset = gender === 'Male' ? 5 : gender === 'Female' ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;
  const tdee = bmr * ACTIVITY_FACTORS[activityLevel];
  const calorieTarget = Math.round(tdee * (1 + GOAL_CALORIE_ADJUSTMENT[healthGoal]));
  const proteinTarget = Math.round(GOAL_PROTEIN_PER_KG[healthGoal] * weightKg);
  const fatTarget = Math.round((calorieTarget * 0.25) / 9);
  const carbTarget = Math.round((calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4);
  const fiberTarget = Math.round(Math.max(25, (calorieTarget / 1000) * 14));
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    proteinTarget,
    carbTarget: Math.max(0, carbTarget),
    fatTarget,
    fiberTarget,
    bmi: roundRupees(bmi),
    bmiLabel: bmiLabelFor(bmi),
  };
}

export function bmiLabelFor(bmi: number): string {
  if (bmi <= 0) return 'Not available';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy range';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function addNutrition(a: NutritionFacts, b: NutritionFacts): NutritionFacts {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

function roundNutrition(value: NutritionFacts): NutritionFacts {
  return {
    calories: Math.round(value.calories),
    protein: roundRupees(value.protein),
    carbs: roundRupees(value.carbs),
    fat: roundRupees(value.fat),
    fiber: roundRupees(value.fiber),
  };
}

/** Purchasable orders only: cancelled orders never count towards any total. */
export function countedOrders(orders: Order[], now: Date = new Date()): Order[] {
  return orders.filter((order) => effectiveStatus(order, now) !== 'Cancelled');
}

export interface PeriodRange {
  start: string;
  end: string;
  days: number;
  label: string;
}

/** Rolling period ranges used by Purchased Nutrition and Budget. */
export function periodRange(period: 'Daily' | BudgetPeriod | 'All Time', now: Date = new Date()): PeriodRange {
  const end = todayIso(now);
  if (period === 'All Time') {
    return { start: '1970-01-01', end, days: 0, label: 'All time' };
  }
  const days = period === 'Daily' ? 1 : period === 'Weekly' ? 7 : now.getDate();
  const start = new Date(now.getTime() - (days - 1) * 86_400_000);
  return {
    start: todayIso(start),
    end,
    days,
    label: period === 'Daily' ? 'Today' : period === 'Weekly' ? 'Last 7 days' : 'This month so far',
  };
}

function withinRange(iso: string, range: PeriodRange): boolean {
  const day = iso.slice(0, 10);
  return day >= range.start && day <= range.end;
}

/**
 * Purchased Nutrition — the nutrition supplied by the groceries that were
 * bought inside the selected period. Derived entirely from real orders.
 */
export function purchasedNutritionSummary(
  orders: Order[],
  period: 'Daily' | 'Weekly' | 'Monthly' | 'All Time',
  profile?: PersonProfile | null,
  now: Date = new Date(),
): PurchasedNutritionSummary {
  const range = periodRange(period, now);
  const relevant = countedOrders(orders, now)
    .filter((order) => period === 'All Time' || withinRange(order.createdAt, range))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  let totals = EMPTY_NUTRITION;
  let itemCount = 0;
  const contributorMap = new Map<number, PurchasedNutritionSummary['topContributors'][number]>();
  const categoryMap = new Map<string, { calories: number; protein: number }>();

  for (const order of relevant) {
    const orderNutrition = order.items.length > 0 && order.nutrition ? order.nutrition : nutritionForItems(order.items);
    totals = addNutrition(totals, orderNutrition);
    for (const item of order.items) {
      itemCount += item.quantity;
      const existing = contributorMap.get(item.productId);
      const calories = item.calories * item.quantity;
      const protein = item.protein * item.quantity;
      contributorMap.set(item.productId, {
        productId: item.productId,
        name: item.name,
        image: item.image,
        quantity: (existing?.quantity ?? 0) + item.quantity,
        unit: item.unit,
        calories: roundRupees((existing?.calories ?? 0) + calories),
        protein: roundRupees((existing?.protein ?? 0) + protein),
      });
      const bucket = categoryMap.get(item.category) ?? { calories: 0, protein: 0 };
      categoryMap.set(item.category, { calories: bucket.calories + calories, protein: bucket.protein + protein });
    }
  }

  const daysCovered = period === 'All Time' ? Math.max(1, uniqueDays(relevant)) : Math.max(1, range.days);
  const roundTotals = roundNutrition(totals);
  const calorieTarget =
    period === 'Daily'
      ? (profile ? computeNutritionTargets(profile).calorieTarget : null)
      : null;

  const totalCalories = roundTotals.calories || 1;
  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, value]) => ({
      category: category as Category | 'Other',
      calories: Math.round(value.calories),
      protein: roundRupees(value.protein),
      share: Math.round((value.calories / totalCalories) * 100),
    }))
    .sort((a, b) => b.calories - a.calories);

  return {
    period,
    calorieTarget,
    totals: roundTotals,
    perDay: {
      calories: Math.round(roundTotals.calories / daysCovered),
      protein: roundRupees(roundTotals.protein / daysCovered),
      carbs: roundRupees(roundTotals.carbs / daysCovered),
      fat: roundRupees(roundTotals.fat / daysCovered),
      fiber: roundRupees(roundTotals.fiber / daysCovered),
    },
    orderCount: relevant.length,
    itemCount,
    daysCovered,
    firstOrderAt: relevant.length ? relevant[relevant.length - 1].createdAt : null,
    lastOrderAt: relevant.length ? relevant[0].createdAt : null,
    topContributors: [...contributorMap.values()].sort((a, b) => b.calories - a.calories).slice(0, 6),
    categoryBreakdown,
  };
}

function uniqueDays(orders: Order[]): number {
  return new Set(orders.map((order) => order.createdAt.slice(0, 10))).size;
}

/**
 * Budget summary. The budget amount is a user setting; the spend always comes
 * from real (non-cancelled) orders inside the selected period.
 */
export function budgetSummary(
  orders: Order[],
  budget: Budget | null,
  period: BudgetPeriod,
  now: Date = new Date(),
): BudgetSummary {
  const range = periodRange(period, now);
  const relevant = countedOrders(orders, now).filter((order) => withinRange(order.createdAt, range));
  const spent = roundRupees(relevant.reduce((sum, order) => sum + order.grandTotal, 0));
  const amount = budget?.amount ?? 0;
  const remaining = roundRupees(amount - spent);
  const usedPercent = amount > 0 ? Math.round((spent / amount) * 100) : 0;

  const categoryMap = new Map<string, { amount: number; orderCount: number }>();
  for (const order of relevant) {
    for (const item of order.items) {
      const bucket = categoryMap.get(item.category) ?? { amount: 0, orderCount: 0 };
      bucket.amount += item.lineTotal;
      bucket.orderCount += 1;
      categoryMap.set(item.category, bucket);
    }
  }

  const totalSpend = spent || 1;
  const categorySpending: CategorySpend[] = [...categoryMap.entries()]
    .map(([category, value]) => ({
      category: category as Category | 'Other',
      amount: roundRupees(value.amount),
      share: Math.round((value.amount / totalSpend) * 100),
      orderCount: value.orderCount,
    }))
    .sort((a, b) => b.amount - a.amount);

  let nutrition = EMPTY_NUTRITION;
  for (const order of relevant) nutrition = addNutrition(nutrition, order.nutrition ?? nutritionForItems(order.items));

  return {
    budget,
    period,
    amount,
    spent,
    remaining,
    usedPercent,
    isOverBudget: amount > 0 && spent > amount,
    isNearLimit: amount > 0 && spent <= amount && usedPercent >= 80,
    orderCount: relevant.length,
    averageOrderValue: relevant.length ? roundRupees(spent / relevant.length) : 0,
    periodStart: range.start,
    periodEnd: range.end,
    categorySpending,
    nutrition: roundNutrition(nutrition),
  };
}

/** Percentage of the daily calorie target that the purchased groceries represent. */
export function targetCompletion(purchased: number, target: number | null): number | null {
  if (!target || target <= 0) return null;
  return Math.round((purchased / target) * 100);
}
