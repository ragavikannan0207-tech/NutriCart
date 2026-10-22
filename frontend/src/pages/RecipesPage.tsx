import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Clock, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { RECIPES, totalMinutes } from '@/data/recipes';
import { getProductById } from '@/data/products';
import { compareRecipeWithPantry } from '@/domain/pantry';
import { MEAL_SLOTS, DIET_TYPES } from '@/types';
import { useAppData } from '@/state/hooks';
import { useDebouncedValue } from '@/hooks';
import { Badge, Card, Chip, EmptyState, SectionHeader } from '@/components/ui/Primitives';
import { ButtonLink } from '@/components/ui/Button';

/** Recipes — discovery page; the pantry comparison happens on the detail page. */
export function RecipesPage() {
  const { pantryItems, activeProfile } = useAppData();
  const [query, setQuery] = useState('');
  const [slot, setSlot] = useState<'All' | (typeof MEAL_SLOTS)[number]>('All');
  const [diet, setDiet] = useState<'All' | (typeof DIET_TYPES)[number]>('All');
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null);
  const debounced = useDebouncedValue(query, 200);

  const results = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return RECIPES.filter((recipe) => {
      if (slot !== 'All' && !recipe.mealSlots.includes(slot)) return false;
      if (diet !== 'All' && recipe.dietType !== diet) return false;
      if (maxMinutes != null && totalMinutes(recipe) > maxMinutes) return false;
      if (!term) return true;
      const ingredientNames = recipe.ingredients.map((item) => getProductById(item.productId)?.name ?? '').join(' ');
      return [recipe.name, recipe.description, recipe.tags.join(' '), ingredientNames].join(' ').toLowerCase().includes(term);
    });
  }, [debounced, slot, diet, maxMinutes]);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <SectionHeader
          eyebrow="Cook from your stock"
          title="Recipes"
          subtitle="Every recipe compares its ingredients against your pantry and adds only what is missing to the cart."
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search recipes, ingredients or tags…"
            aria-label="Search recipes"
            className="h-11 w-full rounded-2xl border border-cream-300 bg-white pl-10 pr-3 text-sm shadow-inset focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip active={slot === 'All'} onClick={() => setSlot('All')}>All meals</Chip>
          {MEAL_SLOTS.map((meal) => (
            <Chip key={meal} active={slot === meal} onClick={() => setSlot(meal)}>{meal}</Chip>
          ))}
          <span className="mx-1 hidden w-px bg-cream-300 sm:block" />
          <Chip active={diet === 'All'} onClick={() => setDiet('All')}>Any diet</Chip>
          {DIET_TYPES.map((option) => (
            <Chip key={option} active={diet === option} onClick={() => setDiet(option)}>
              {option === 'No Restriction' ? 'Both' : option}
            </Chip>
          ))}
          <span className="mx-1 hidden w-px bg-cream-300 sm:block" />
          {[15, 25, 40].map((minutes) => (
            <Chip key={minutes} active={maxMinutes === minutes} onClick={() => setMaxMinutes(maxMinutes === minutes ? null : minutes)}>
              Under {minutes} min
            </Chip>
          ))}
        </div>
      </header>

      {results.length === 0 ? (
        <EmptyState icon={<ChefHat className="h-4 w-4" />} title="No recipes matched" description="Try a different ingredient, meal slot or time limit." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((recipe) => {
            const comparison = compareRecipeWithPantry(recipe, pantryItems, getProductById);
            return (
              <Card key={recipe.id} className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
                <Link to={`/recipes/${recipe.id}`} className="block aspect-[4/3] overflow-hidden bg-cream-100">
                  <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
                </Link>
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={recipe.dietType === 'Vegetarian' ? 'success' : 'warning'}>{recipe.dietType}</Badge>
                    {recipe.mealSlots.map((meal) => (
                      <Badge key={meal} tone="neutral">{meal}</Badge>
                    ))}
                  </div>
                  <Link to={`/recipes/${recipe.id}`}>
                    <h3 className="text-sm font-semibold text-ink-900 transition group-hover:text-forest-800">{recipe.name}</h3>
                  </Link>
                  <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">{recipe.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-2xs text-ink-600">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-sage-600" /> {totalMinutes(recipe)} min</span>
                    <span>{recipe.calories} kcal</span>
                    <span>{recipe.protein} g protein</span>
                    <span>{recipe.carbs} g carbs</span>
                  </div>
                  <p className={clsx('text-2xs font-medium', comparison.missingCount === 0 ? 'text-forest-700' : 'text-ink-500')}>
                    {pantryItems.length === 0
                      ? 'Add pantry items to compare'
                      : comparison.missingCount === 0
                        ? 'Everything already in your pantry'
                        : `${comparison.missingCount} ingredient${comparison.missingCount === 1 ? '' : 's'} to buy`}
                  </p>
                  <ButtonLink to={`/recipes/${recipe.id}`} size="sm" variant="outline" fullWidth>
                    View recipe
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeProfile ? (
        <Card className="bg-sage-50 p-4">
          <p className="text-xs leading-relaxed text-sage-700">
            Recipes shown here fit {activeProfile.name}&apos;s {activeProfile.dietType.toLowerCase()} diet and{' '}
            {activeProfile.healthGoal.toLowerCase()} goal. Filter by meal slot or time when you are in a hurry.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
