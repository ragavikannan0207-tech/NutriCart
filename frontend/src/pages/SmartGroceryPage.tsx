import { useState } from 'react';
import { Info, ShoppingCart, Sparkles, Users, Wallet } from 'lucide-react';
import type { DietType, HealthGoal, SmartGroceryPlan, SmartGroceryRequest } from '@/types';
import { DIET_TYPES, HEALTH_GOALS } from '@/types';
import { generateSmartGroceryPlan } from '@/domain/recommendations';
import { useAppData } from '@/state/hooks';
import { useToast } from '@/state/ToastContext';
import { Badge, Card, CardHeader, EmptyState, Progress, StatTile } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Switch, TextInput } from '@/components/ui/Field';
import { Dropdown, toOptions } from '@/components/ui/Dropdown';
import { formatCurrency } from '@/utils/format';

/**
 * Smart Grocery — a budget-aware basket generator.
 * People, budget, duration, diet and goal all change the result: a ₹250 budget and
 * a ₹2,500 budget never produce the same plan, and the basket can never exceed the
 * chosen budget.
 */
export function SmartGroceryPage() {
  const { activeProfile, pantryItems, addManyToCart, addToCart } = useAppData();
  const toast = useToast();
  const [peopleCount, setPeopleCount] = useState(activeProfile ? 2 : 1);
  const [budget, setBudget] = useState(activeProfile?.budgetAmount ?? 2500);
  const [durationDays, setDurationDays] = useState(7);
  const [dietType, setDietType] = useState<DietType>(activeProfile?.dietType ?? 'No Restriction');
  const [healthGoal, setHealthGoal] = useState<HealthGoal>(activeProfile?.healthGoal ?? 'General Healthy Eating');
  const [usePantry, setUsePantry] = useState(true);
  const [plan, setPlan] = useState<SmartGroceryPlan | null>(null);

  const generate = () => {
    const request: SmartGroceryRequest = {
      peopleCount,
      budget,
      durationDays,
      dietType,
      healthGoal,
      profileId: activeProfile?.id ?? 0,
      usePantry,
    };
    const next = generateSmartGroceryPlan(request, pantryItems);
    setPlan(next);
    if (next.lines.length === 0) {
      toast.info('No basket generated', 'Increase the budget so at least one staple fits.');
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Smart Grocery</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-500">
          Tell NutriCart how many people you are feeding, for how long and with how much money. The basket is built from
          real catalogue prices, your diet, your goal and the stock already in your pantry.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardHeader title="Plan inputs" subtitle="Every field changes the generated basket" />
          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="People"
                type="number"
                min={1}
                max={20}
                step={1}
                inputMode="numeric"
                leadingIcon={<Users className="h-4 w-4" />}
                value={String(peopleCount)}
                onChange={(event) => setPeopleCount(Math.max(1, Math.min(20, Number(event.target.value.replace(/\D/g, '') || 1))))}
              />
              <TextInput
                label="Duration (days)"
                inputMode="numeric"
                value={String(durationDays)}
                onChange={(event) => setDurationDays(Math.max(1, Math.min(60, Number(event.target.value.replace(/\D/g, '') || 1))))}
              />
            </div>

            <TextInput
              label="Budget"
              inputMode="numeric"
              leadingIcon={<Wallet className="h-4 w-4" />}
              hint="The basket will never exceed this amount."
              value={String(budget)}
              onChange={(event) => setBudget(Math.max(0, Number(event.target.value.replace(/\D/g, '') || 0)))}
            />

            <div className="flex flex-wrap gap-1.5">
              {[250, 500, 1000, 2500, 5000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBudget(amount)}
                  className="rounded-full border border-cream-300 bg-white px-2.5 py-1 text-2xs font-medium text-ink-600 transition hover:border-forest-300 hover:text-forest-800"
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Diet</p>
              <Dropdown value={dietType} options={toOptions(DIET_TYPES)} onChange={(value) => setDietType(value as DietType)} />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Goal</p>
              <Dropdown value={healthGoal} options={toOptions(HEALTH_GOALS)} onChange={(value) => setHealthGoal(value as HealthGoal)} />
            </div>

            <Switch
              checked={usePantry}
              onChange={setUsePantry}
              label="Use my pantry stock"
              description="Skip anything you already have at home."
            />

            <Button fullWidth size="lg" icon={<Sparkles className="h-4 w-4" />} onClick={generate}>
              Generate plan
            </Button>
            {activeProfile ? (
              <p className="text-2xs leading-relaxed text-ink-500">
                Building for {activeProfile.name} · {activeProfile.activityLevel.toLowerCase()} · targets recalculated from the profile.
              </p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          {!plan ? (
            <EmptyState
              icon={<Sparkles className="h-4 w-4" />}
              title="No plan generated yet"
              description="Set your people, budget, duration, diet and goal, then generate a basket. Nothing is added to your cart until you ask for it."
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Basket total" value={formatCurrency(plan.estimatedTotal)} hint={`${plan.lines.length} products`} tone="brand" />
                <StatTile label="Budget" value={formatCurrency(plan.budget)} hint={`${plan.request.peopleCount} people · ${plan.request.durationDays} days`} />
                <StatTile label="Remaining" value={formatCurrency(plan.remainingBudget)} tone={plan.remainingBudget === 0 ? 'warning' : 'default'} hint="Unspent budget" />
                <StatTile label="Protein in basket" value={`${plan.totalProtein} g`} hint={`${plan.totalCalories} kcal total`} />
              </div>

              <Card>
                <CardHeader
                  title="Generated basket"
                  subtitle={`${plan.request.dietType} · ${plan.request.healthGoal} · ${plan.request.peopleCount} people · ${plan.request.durationDays} days`}
                  action={
                    <Button
                      size="sm"
                      icon={<ShoppingCart className="h-3.5 w-3.5" />}
                      disabled={plan.lines.length === 0}
                      onClick={async () => {
                        const count = await addManyToCart(plan.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })));
                        toast.success(`${count} products added to your cart`);
                      }}
                    >
                      Add all
                    </Button>
                  }
                />

                {plan.budget > 0 ? (
                  <div className="px-5 pt-4">
                    <div className="flex items-center justify-between text-xs text-ink-500">
                      <span>Budget used</span>
                      <span className="font-semibold text-forest-700">
                        {Math.round((plan.estimatedTotal / Math.max(1, plan.budget)) * 100)}%
                      </span>
                    </div>
                    <Progress value={(plan.estimatedTotal / Math.max(1, plan.budget)) * 100} className="mt-2" />
                  </div>
                ) : null}

                <ul className="mt-3 divide-y divide-cream-200">
                  {plan.lines.map((line) => (
                    <li key={line.productId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <img src={line.image} alt="" className="h-12 w-12 rounded-xl border border-cream-300 object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-ink-800">{line.productName}</p>
                          <Badge tone="neutral">{line.category}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-500">{line.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink-900">{formatCurrency(line.estimatedPrice)}</p>
                        <p className="text-2xs text-ink-500">
                          {line.quantity} × {line.unit}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void addToCart(line.productId, line.quantity)}>
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>

              {plan.notes.length > 0 ? (
                <Card className="space-y-2 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-ink-800">
                    <Info className="h-3.5 w-3.5 text-sage-600" />
                    How this basket was built
                  </p>
                  <ul className="space-y-1.5">
                    {plan.notes.map((note) => (
                      <li key={note} className="text-xs leading-relaxed text-ink-500">
                        • {note}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <ButtonLink to="/cart" variant="outline" size="sm">
                  Review cart
                </ButtonLink>
                <ButtonLink to="/budget" variant="ghost" size="sm">
                  Check budget
                </ButtonLink>
                <ButtonLink to="/meal-planner" variant="ghost" size="sm">
                  Plan meals instead
                </ButtonLink>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
