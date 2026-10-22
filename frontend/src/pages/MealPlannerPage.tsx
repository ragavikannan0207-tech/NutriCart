import { useMemo, useState } from 'react';
import { CalendarRange, Plus, ShoppingCart, Trash2, Utensils } from 'lucide-react';
import { clsx } from 'clsx';
import type { DayOfWeek, MealSlot } from '@/types';
import { DAYS_OF_WEEK, MEAL_SLOTS } from '@/types';
import { RECIPES, getRecipeById } from '@/data/recipes';
import { getProductById } from '@/data/products';
import { aggregateWeeklyRequirements, startOfWeekIso } from '@/domain/pantry';
import { useAppData } from '@/state/hooks';
import { useToast } from '@/state/ToastContext';
import { Badge, Card, CardHeader, EmptyState, StatTile } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatQuantity } from '@/utils/units';

/**
 * Meal Planner — a weekly calendar of breakfast, lunch and dinner.
 * "Add this week to cart" aggregates every planned meal, merges duplicates,
 * subtracts pantry stock and pushes only the remaining quantities to the cart.
 */
export function MealPlannerPage() {
  const { mealPlan, addMeal, updateMeal, removeMeal, pantryItems, addManyToCart, loadMealPlanWeek } = useAppData();
  const toast = useToast();
  const [dialog, setDialog] = useState<{ day: DayOfWeek; slot: MealSlot } | null>(null);
  const [recipeId, setRecipeId] = useState<number>(RECIPES[0].id);
  const [servings, setServings] = useState<number>(RECIPES[0].servings);

  const summary = useMemo(
    () => (mealPlan ? aggregateWeeklyRequirements(mealPlan, getRecipeById, pantryItems, getProductById) : null),
    [mealPlan, pantryItems],
  );

  const weekDates = useMemo(() => {
    const start = new Date(`${mealPlan?.weekStart ?? startOfWeekIso()}T00:00:00`);
    return DAYS_OF_WEEK.map((day, index) => {
      const date = new Date(start.getTime() + index * 86_400_000);
      return { day, iso: date.toISOString().slice(0, 10) };
    });
  }, [mealPlan?.weekStart]);

  const itemsFor = (day: DayOfWeek, slot: MealSlot) => (mealPlan?.items ?? []).filter((item) => item.day === day && item.slot === slot);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Meal Planner</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Plan the week, then buy only what is missing. Duplicate ingredients across meals are merged before anything is
            added to your cart.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadMealPlanWeek(startOfWeekIso())}>
            This week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const base = mealPlan?.weekStart ?? startOfWeekIso();
              const next = new Date(`${base}T00:00:00`);
              next.setDate(next.getDate() + 7);
              void loadMealPlanWeek(next.toISOString().slice(0, 10));
            }}
          >
            Next week
          </Button>
        </div>
      </header>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Meals planned" value={summary.mealCount} hint={`Week of ${formatDate(summary.weekStart)}`} icon={<CalendarRange className="h-4 w-4" />} />
          <StatTile label="Estimated cost" value={formatCurrency(summary.estimatedCost)} hint="Only for what you still need to buy" tone="brand" />
          <StatTile label="Calories planned" value={`${summary.totalCalories} kcal`} hint="Missing ingredients only" />
          <StatTile label="Protein planned" value={`${summary.totalProtein} g`} hint="Missing ingredients only" tone="brand" />
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-7">
        {weekDates.map(({ day, iso }) => (
          <Card key={day} className="flex flex-col overflow-hidden">
            <div className="border-b border-cream-200 bg-cream-50 px-3 py-2">
              <p className="text-xs font-semibold text-ink-800">{day}</p>
              <p className="text-2xs text-ink-500">{formatDate(iso)}</p>
            </div>
            <div className="flex-1 space-y-2 p-2.5">
              {MEAL_SLOTS.map((slot) => {
                const items = itemsFor(day, slot);
                return (
                  <div key={slot} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">{slot}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDialog({ day, slot });
                          setRecipeId(RECIPES[0].id);
                          setServings(RECIPES[0].servings);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-lg text-ink-500 transition hover:bg-cream-200 hover:text-forest-700"
                        aria-label={`Add ${slot} for ${day}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-cream-300 px-2 py-1.5 text-2xs text-ink-500">Empty</p>
                    ) : (
                      items.map((item) => {
                        const recipe = getRecipeById(item.recipeId);
                        return (
                          <div key={item.id} className="rounded-lg border border-cream-300 bg-white p-2">
                            <p className="text-2xs font-medium leading-snug text-ink-800">{recipe?.name ?? 'Recipe'}</p>
                            <div className="mt-1 flex items-center justify-between gap-1">
                              <Dropdown
                                size="sm"
                                value={item.servings}
                                onChange={(value) => void updateMeal(item.id, { servings: Number(value) })}
                                options={[1, 2, 3, 4].map((value) => ({ value, label: `${value} serv` }))}
                              />
                              <button
                                type="button"
                                onClick={() => void removeMeal(item.id)}
                                className="flex h-5 w-5 items-center justify-center rounded-lg text-clay-500 transition hover:bg-clay-100"
                                aria-label="Remove meal"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Weekly shopping requirement"
          subtitle="Ingredients aggregated across every planned meal, minus what is already in your pantry"
          action={
            <Button
              size="sm"
              icon={<ShoppingCart className="h-3.5 w-3.5" />}
              disabled={!summary || summary.requirements.filter((line) => line.cartQuantity > 0).length === 0}
              onClick={async () => {
                const lines = summary!.requirements.filter((line) => line.cartQuantity > 0).map((line) => ({ productId: line.productId, quantity: line.cartQuantity }));
                const count = await addManyToCart(lines);
                toast.success(`${count} product${count === 1 ? '' : 's'} added to your cart`);
              }}
            >
              Add this week to cart
            </Button>
          }
        />
        {!summary || summary.requirements.length === 0 ? (
          <div className="px-5 py-4">
            <EmptyState
              compact
              icon={<Utensils className="h-4 w-4" />}
              title="No meals planned this week"
              description="Add meals to the calendar and NutriCart will build the shopping list automatically."
            />
          </div>
        ) : (
          <ul className="divide-y divide-cream-200">
            {summary.requirements.map((line) => (
              <li key={line.productId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">{line.name}</p>
                  <p className="text-xs text-ink-500">
                    Need {formatQuantity(line.requiredQuantity, 'g')} · pantry {formatQuantity(line.availableQuantity, 'g')} ·
                    missing {formatQuantity(line.missingQuantity, 'g')} → {line.cartQuantity} × {line.unit}
                  </p>
                </div>
                <Badge tone={line.coveredByPantry ? 'success' : 'warning'}>
                  {line.coveredByPantry ? 'Covered by pantry' : formatCurrency(line.estimatedPrice)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        title={dialog ? `Add ${dialog.slot} on ${dialog.day}` : 'Add meal'}
        description="Pick a recipe and the number of servings; the ingredients flow into the weekly list."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!dialog) return;
                await addMeal(dialog.day, dialog.slot, recipeId, servings, mealPlan?.weekStart ?? startOfWeekIso());
                toast.success('Meal added to the plan');
                setDialog(null);
              }}
            >
              Add meal
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Recipe</p>
            <Dropdown
              value={recipeId}
              onChange={(value) => {
                const next = Number(value);
                setRecipeId(next);
                setServings(getRecipeById(next)?.servings ?? 1);
              }}
              options={RECIPES.map((recipe) => ({
                value: recipe.id,
                label: recipe.name,
                description: `${recipe.mealSlots.join(' · ')} · ${recipe.calories} kcal`,
              }))}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Servings</p>
            <Dropdown
              value={servings}
              onChange={setServings}
              options={[1, 2, 3, 4, 6].map((value) => ({ value, label: String(value) }))}
            />
          </div>
          {getRecipeById(recipeId) ? (
            <div className="rounded-xl border border-cream-300 bg-cream-50 p-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Ingredients that will be planned</p>
              <ul className={clsx('mt-1.5 space-y-1 text-xs text-ink-600')}>
                {getRecipeById(recipeId)!.ingredients.map((item) => (
                  <li key={item.productId}>
                    {getProductById(item.productId)?.name} — {formatQuantity(item.normalisedQuantity * (servings / getRecipeById(recipeId)!.servings), item.normalisedUnit)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Modal>

      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/recipes" variant="outline" size="sm">
          Browse recipes
        </ButtonLink>
        <ButtonLink to="/pantry" variant="ghost" size="sm">
          Update pantry quantities
        </ButtonLink>
        <ButtonLink to="/cart" variant="ghost" size="sm">
          Review cart
        </ButtonLink>
      </div>
    </div>
  );
}
