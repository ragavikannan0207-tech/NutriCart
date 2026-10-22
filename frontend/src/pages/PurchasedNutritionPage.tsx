import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { NutritionPeriod } from '@/types';
import { purchasedNutritionSummary, targetCompletion } from '@/domain/nutrition';
import { PRICING } from '@/domain/pricing';
import { useAppData, useNutritionTargets } from '@/state/hooks';
import { Badge, Card, CardHeader, EmptyState, NutritionRow, Progress, StatTile, Tabs } from '@/components/ui/Primitives';
import { ButtonLink } from '@/components/ui/Button';
import { formatDateTime, formatNumber } from '@/utils/format';

/**
 * Purchased Nutrition — how much nutrition the groceries you BOUGHT provide.
 * Named deliberately: it is not a record of what was consumed.
 */
type PeriodTab = NutritionPeriod | 'All Time';

export function PurchasedNutritionPage() {
  const { orders, activeProfile } = useAppData();
  const targets = useNutritionTargets();
  const [period, setPeriod] = useState<PeriodTab>('Weekly');

  const summary = useMemo(
    () => purchasedNutritionSummary(orders, period, activeProfile),
    [orders, period, activeProfile],
  );

  const calorieCompletion = targetCompletion(summary.perDay.calories, targets?.calorieTarget ?? null);
  const proteinCompletion = targetCompletion(summary.perDay.protein, targets?.proteinTarget ?? null);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Purchased Nutrition</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-500">See the nutrition provided by the groceries you purchased.</p>
        <p className="mt-1 max-w-3xl text-2xs leading-relaxed text-ink-500">{PRICING.nutritionDisclaimer}</p>
      </header>

      <Tabs
        value={period}
        onChange={setPeriod}
        tabs={[
          { value: 'Daily', label: 'Today' },
          { value: 'Weekly', label: 'Last 7 days' },
          { value: 'Monthly', label: 'This month' },
          { value: 'All Time', label: 'All time' },
        ]}
        className="max-w-xl"
      />

      {summary.orderCount === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-4 w-4" />}
          title="No purchased nutrition yet"
          description="Nothing has been purchased in this period, so every figure is genuinely zero. Place an order and this page fills with the calories, protein, carbs, fat and fibre those groceries provide."
          action={<ButtonLink to="/shop">Shop groceries</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile label="Calories" value={formatNumber(summary.totals.calories)} hint={`${formatNumber(summary.perDay.calories)} / day average`} tone="brand" />
            <StatTile label="Protein" value={`${formatNumber(summary.totals.protein)} g`} hint={`${formatNumber(summary.perDay.protein)} g / day average`} />
            <StatTile label="Carbs" value={`${formatNumber(summary.totals.carbs)} g`} hint={`${formatNumber(summary.perDay.carbs)} g / day`} />
            <StatTile label="Fat" value={`${formatNumber(summary.totals.fat)} g`} hint={`${formatNumber(summary.perDay.fat)} g / day`} />
            <StatTile label="Fibre" value={`${formatNumber(summary.totals.fiber)} g`} hint={`${formatNumber(summary.perDay.fiber)} g / day`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader
                title="Against your daily targets"
                subtitle={`Targets for ${activeProfile?.name ?? 'this person'} from ${targets ? `${targets.calorieTarget} kcal and ${targets.proteinTarget} g protein` : 'the active profile'}`}
              />
              <div className="space-y-4 px-5 py-4">
                {targets ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-500">Calories per day from purchases</span>
                        <span className="font-semibold text-forest-700">
                          {formatNumber(summary.perDay.calories)} / {targets.calorieTarget} kcal
                        </span>
                      </div>
                      <Progress value={calorieCompletion ?? 0} className="mt-2" />
                      <p className="mt-1 text-2xs text-ink-500">
                        {calorieCompletion != null ? `${calorieCompletion}% of the daily calorie target` : 'Target not available'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-500">Protein per day from purchases</span>
                        <span className="font-semibold text-forest-700">
                          {formatNumber(summary.perDay.protein)} / {targets.proteinTarget} g
                        </span>
                      </div>
                      <Progress value={proteinCompletion ?? 0} className="mt-2" />
                      <p className="mt-1 text-2xs text-ink-500">
                        {proteinCompletion != null ? `${proteinCompletion}% of the daily protein target` : 'Target not available'}
                      </p>
                    </div>
                    <p className="text-2xs leading-relaxed text-ink-500">
                      These percentages compare purchased groceries with a calculated target — they never claim that the food
                      was eaten. Targets use Mifflin-St Jeor, the activity factor and the selected goal.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-ink-500">Create a person profile to calculate daily targets.</p>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Period" subtitle={`${summary.orderCount} order${summary.orderCount === 1 ? '' : 's'} · ${summary.itemCount} products · ${summary.daysCovered} day${summary.daysCovered === 1 ? '' : 's'} covered`} />
              <div className="space-y-1.5 px-5 py-4 text-xs">
                <div className="flex justify-between"><span className="text-ink-500">First purchase</span><span className="text-ink-800">{formatDateTime(summary.firstOrderAt)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Latest purchase</span><span className="text-ink-800">{formatDateTime(summary.lastOrderAt)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Cancelled orders</span><span className="text-ink-800">Excluded from all totals</span></div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top contributors" subtitle="Products that supplied the most calories" />
              <ul className="divide-y divide-cream-200">
                {summary.topContributors.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 px-5 py-3">
                    <img src={item.image} alt="" className="h-10 w-10 rounded-xl border border-cream-300 object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-800">{item.name}</p>
                      <p className="text-xs text-ink-500">
                        {item.quantity} × {item.unit} purchased
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-ink-900">{formatNumber(item.calories)} kcal</p>
                      <p className="text-ink-500">{formatNumber(item.protein)} g protein</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="By category" subtitle="Share of purchased calories per aisle" />
              <div className="space-y-3 px-5 py-4">
                {summary.categoryBreakdown.map((entry) => (
                  <div key={entry.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-600">{entry.category}</span>
                      <span className="font-medium text-ink-800">
                        {formatNumber(entry.calories)} kcal · {entry.share}%
                      </span>
                    </div>
                    <Progress value={entry.share} height="h-1.5" />
                  </div>
                ))}
                <div className="h-px w-full bg-cream-200" />
                <div className="grid grid-cols-2 gap-x-6">
                  <NutritionRow label="Total calories" value={summary.totals.calories} unit="kcal" highlight />
                  <NutritionRow label="Total protein" value={summary.totals.protein} unit="g" highlight />
                  <NutritionRow label="Total carbs" value={summary.totals.carbs} unit="g" />
                  <NutritionRow label="Total fat" value={summary.totals.fat} unit="g" />
                  <NutritionRow label="Total fibre" value={summary.totals.fiber} unit="g" />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="info">Period: {summary.period}</Badge>
            <ButtonLink to="/orders" variant="outline" size="sm">
              View orders and invoices
            </ButtonLink>
            <ButtonLink to="/budget" variant="ghost" size="sm">
              Check budget
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
