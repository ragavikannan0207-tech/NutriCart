import type { BudgetPeriod, Category, Id, IsoDateTime, NotificationType, NutritionFacts } from './common';

export interface Budget {
  id: Id;
  userId: Id;
  personProfileId: Id;
  period: BudgetPeriod;
  amount: number;
  updatedAt: IsoDateTime;
}

export interface CategorySpend {
  category: Category | 'Other';
  amount: number;
  share: number;
  orderCount: number;
}

export interface BudgetSummary {
  budget: Budget | null;
  period: BudgetPeriod;
  amount: number;
  spent: number;
  remaining: number;
  usedPercent: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  orderCount: number;
  averageOrderValue: number;
  periodStart: string;
  periodEnd: string;
  categorySpending: CategorySpend[];
  /** Nutrition purchased inside the same period (kept consistent with Purchased Nutrition). */
  nutrition: NutritionFacts;
}

/** Aggregate of the nutrition contained in purchased groceries. */
export interface PurchasedNutritionSummary {
  period: 'Daily' | 'Weekly' | 'Monthly' | 'All Time';
  calorieTarget: number | null;
  totals: NutritionFacts;
  /** Totals divided across the days in the selected period — never presented as "consumed". */
  perDay: NutritionFacts;
  orderCount: number;
  itemCount: number;
  daysCovered: number;
  firstOrderAt: IsoDateTime | null;
  lastOrderAt: IsoDateTime | null;
  topContributors: Array<{
    productId: Id;
    name: string;
    image: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
  }>;
  categoryBreakdown: Array<{ category: Category | 'Other'; calories: number; protein: number; share: number }>;
}

/** Personalised recommendation bucket rendered on the For You page. */
export interface RecommendationGroup {
  key: string;
  title: string;
  subtitle: string;
  products: Id[];
  reason: string;
}

export interface HealthAlternativeGroup {
  key: string;
  query: string;
  swapFrom: string;
  swapToName: string;
  swapToProductId: Id;
  reason: string;
  nutritionWin: string;
}

export type NotificationFilter = 'all' | 'important';


export interface NotificationDraft {
  type: NotificationType;
  title: string;
  message: string;
  actionPath?: string;
  personProfileId?: Id | null;
  isImportant?: boolean;
  createdAt?: IsoDateTime;
}
