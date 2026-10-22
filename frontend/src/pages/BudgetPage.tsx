import { useMemo, useState } from 'react';
import { BadgeIndianRupee, Wallet } from 'lucide-react';
import type { BudgetPeriod } from '@/types';
import { budgetSummary, periodRange } from '@/domain/nutrition';
import { useAppData } from '@/state/hooks';
import { useToast } from '@/state/ToastContext';
import { Badge, Card, CardHeader, EmptyState, NutritionRow, Progress, StatTile, Tabs } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Dropdown, toOptions } from '@/components/ui/Dropdown';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';

/**
 * Budget — the amount is a user setting; the spend always comes from real,
 * non-cancelled orders inside the selected period. Every profile keeps its own
 * budget and its own spending view.
 */
export function BudgetPage() {
  const { budget, saveBudget, activeProfile, orders } = useAppData();
  const toast = useToast();
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? activeProfile?.budgetPeriod ?? 'Weekly');
  const [amount, setAmount] = useState<string>(String(budget?.amount ?? activeProfile?.budgetAmount ?? 2500));

  const preview = useMemo(() => {
    const draft = budget ?? {
      id: 0,
      userId: 0,
      personProfileId: activeProfile?.id ?? 0,
      period,
      amount: Number(amount || 0),
      updatedAt: new Date().toISOString(),
    };
    return budgetSummary(orders, { ...draft, amount: Number(amount || 0), period }, period);
  }, [budget, orders, activeProfile, amount, period]);

  const range = periodRange(period);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Budget</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-500">
          Set what you want to spend{activeProfile ? ` for ${activeProfile.name}` : ''} and NutriCart tracks it against the
          orders you actually placed. No estimated or invented spending is ever shown.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader title="Your budget" subtitle="Applies to the active person" />
          <div className="space-y-4 px-5 py-4">
            <TextInput
              label="Budget amount"
              inputMode="numeric"
              leadingIcon={<Wallet className="h-4 w-4" />}
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))}
            />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Period</p>
              <Dropdown value={period} options={toOptions(['Weekly', 'Monthly'])} onChange={(value) => setPeriod(value as BudgetPeriod)} />
            </div>
            <Button
              fullWidth
              onClick={async () => {
                await saveBudget(Number(amount || 0), period);
                toast.success('Budget saved', `₹${amount} per ${period.toLowerCase()} for ${activeProfile?.name ?? 'this profile'}.`);
              }}
            >
              Save budget
            </Button>
            <div className="rounded-xl bg-cream-100 p-3 text-2xs leading-relaxed text-ink-500">
              Period in view: {range.label} ({formatDate(range.start)} → {formatDate(range.end)}).
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Budget" value={formatCurrency(preview.amount)} hint={`Per ${preview.period.toLowerCase()}`} />
            <StatTile label="Spent" value={formatCurrency(preview.spent)} hint={`${preview.orderCount} order${preview.orderCount === 1 ? '' : 's'}`} tone="brand" />
            <StatTile
              label="Remaining"
              value={formatCurrency(preview.remaining)}
              tone={preview.remaining < 0 ? 'danger' : 'default'}
              hint={preview.remaining < 0 ? 'Budget exceeded' : 'Still available'}
            />
            <StatTile label="Average order" value={formatCurrency(preview.averageOrderValue)} hint="Across this period" />
          </div>

          <Card>
            <CardHeader
              title="Budget usage"
              subtitle={`${formatDate(preview.periodStart)} → ${formatDate(preview.periodEnd)}`}
              action={
                preview.isOverBudget ? (
                  <Badge tone="danger">Over budget</Badge>
                ) : preview.isNearLimit ? (
                  <Badge tone="warning">Close to the limit</Badge>
                ) : (
                  <Badge tone="success">On track</Badge>
                )
              }
            />
            <div className="space-y-3 px-5 py-4">
              <Progress
                value={preview.amount > 0 ? Math.min(100, preview.usedPercent) : 0}
                tone={preview.isOverBudget ? 'danger' : preview.isNearLimit ? 'warning' : 'brand'}
              />
              <p className="text-xs text-ink-500">
                {preview.amount > 0
                  ? `${preview.usedPercent}% of your ${preview.period.toLowerCase()} budget is used.`
                  : 'Set an amount to track usage.'}
              </p>
            </div>
          </Card>

          {preview.spent === 0 ? (
            <EmptyState
              icon={<BadgeIndianRupee className="h-4 w-4" />}
              title="No spending in this period yet"
              description="Your budget is set, but no confirmed orders fall inside this period. Place an order and the spend, category split and budget warnings update immediately."
              action={<ButtonLink to="/shop">Shop groceries</ButtonLink>}
            />
          ) : (
            <Card>
              <CardHeader title="Where the money went" subtitle="Category split from real order lines" />
              <div className="space-y-3 px-5 py-4">
                {preview.categorySpending.map((entry) => (
                  <div key={entry.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-600">{entry.category}</span>
                      <span className="font-medium text-ink-800">
                        {formatCurrency(entry.amount)} · {entry.share}%
                      </span>
                    </div>
                    <Progress value={entry.share} height="h-1.5" />
                  </div>
                ))}
                <div className="h-px w-full bg-cream-200" />
                <div className="grid grid-cols-2 gap-x-6">
                  <NutritionRow label="Calories bought" value={preview.nutrition.calories} unit="kcal" />
                  <NutritionRow label="Protein bought" value={preview.nutrition.protein} unit="g" />
                  <NutritionRow label="Carbs bought" value={preview.nutrition.carbs} unit="g" />
                  <NutritionRow label="Fat bought" value={preview.nutrition.fat} unit="g" />
                </div>
                <p className="text-2xs leading-relaxed text-ink-500">
                  Nutrition is the total contained in the groceries inside this period ({formatNumber(preview.nutrition.calories)} kcal), not a record of consumption.
                </p>
              </div>
            </Card>
          )}

          <Tabs
            value={period}
            onChange={setPeriod}
            tabs={[
              { value: 'Weekly', label: 'Weekly view' },
              { value: 'Monthly', label: 'Monthly view' },
            ]}
            className="max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}
