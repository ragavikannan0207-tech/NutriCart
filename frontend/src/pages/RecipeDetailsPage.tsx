import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChefHat, Clock, ShoppingCart, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { getRecipeById, recipeProducts, totalMinutes } from '@/data/recipes';
import { compareRecipeWithPantry } from '@/domain/pantry';
import { getProductById } from '@/data/products';
import { useAppData } from '@/state/hooks';
import { useToast } from '@/state/ToastContext';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Badge, Card, CardHeader, EmptyState, NutritionRow, SectionHeader } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { formatQuantity } from '@/utils/units';

/** Recipe details with genuine pantry comparison and cart actions. */
export function RecipeDetailsPage() {
  const { recipeId } = useParams();
  const recipe = getRecipeById(Number(recipeId));
  const { pantryItems, addManyToCart } = useAppData();
  const toast = useToast();
  const [servings, setServings] = useState<number>(recipe?.servings ?? 1);

  const comparison = useMemo(
    () => (recipe ? compareRecipeWithPantry(recipe, pantryItems, getProductById) : null),
    [recipe, pantryItems],
  );

  if (!recipe || !comparison) {
    return (
      <EmptyState
        title="Recipe not found"
        description="That recipe is not part of the NutriCart collection."
        action={<ButtonLink to="/recipes" size="sm">All recipes</ButtonLink>}
      />
    );
  }

  const scale = servings / Math.max(1, recipe.servings);
  const ingredients = recipeProducts(recipe);

  return (
    <div className="space-y-6">
      <Link to="/recipes" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-forest-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        All recipes
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="overflow-hidden">
          <img src={recipe.image} alt={recipe.name} className="aspect-[4/3] w-full object-cover" />
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={recipe.dietType === 'Vegetarian' ? 'success' : 'warning'}>{recipe.dietType}</Badge>
              {recipe.mealSlots.map((meal) => (
                <Badge key={meal} tone="neutral">{meal}</Badge>
              ))}
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} tone="info">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{recipe.name}</h1>
            <p className="text-sm leading-relaxed text-ink-600">{recipe.description}</p>
            <div className="grid grid-cols-3 gap-3 text-xs text-ink-600">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-sage-600" /> {totalMinutes(recipe)} min</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-sage-600" /> {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}</span>
              <span className="flex items-center gap-1.5"><ChefHat className="h-3.5 w-3.5 text-sage-600" /> {recipe.ingredients.length} ingredients</span>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Nutrition per serving" subtitle="Computed from the real catalogue values of every ingredient" />
            <div className="grid gap-x-6 px-5 py-3 sm:grid-cols-2">
              <NutritionRow label="Calories" value={Math.round(recipe.calories / recipe.servings)} unit="kcal" highlight />
              <NutritionRow label="Protein" value={Number((recipe.protein / recipe.servings).toFixed(1))} unit="g" highlight />
              <NutritionRow label="Carbohydrates" value={Number((recipe.carbs / recipe.servings).toFixed(1))} unit="g" />
              <NutritionRow label="Fat" value={Number((recipe.fat / recipe.servings).toFixed(1))} unit="g" />
              <NutritionRow label="Fibre" value={Number((recipe.fiber / recipe.servings).toFixed(1))} unit="g" />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Ingredients & pantry check"
              subtitle={pantryItems.length === 0 ? 'Add items to My Pantry to see exactly what is missing.' : 'Missing quantities only go into your cart.'}
              action={
                <Dropdown
                  size="sm"
                  label="Servings"
                  value={servings}
                  onChange={setServings}
                  options={[1, 2, 3, 4, 6, 8].map((value) => ({ value, label: String(value) }))}
                />
              }
            />
            <ul className="divide-y divide-cream-200">
              {recipe.ingredients.map((ingredient) => {
                const product = getProductById(ingredient.productId);
                const line = comparison.lines.find((entry) => entry.productId === ingredient.productId);
                const required = ingredient.normalisedQuantity * scale;
                return (
                  <li key={ingredient.productId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-cream-300 bg-cream-100">
                      {product ? <img src={product.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/shop/product/${ingredient.productId}`} className="block truncate text-sm font-medium text-ink-800 hover:text-forest-800">
                        {product?.name ?? line?.name}
                        {ingredient.optional ? <span className="ml-1.5 text-2xs text-ink-500">(optional)</span> : null}
                      </Link>
                      <p className="text-xs text-ink-500">
                        Need {formatQuantity(required, ingredient.normalisedUnit)} · in pantry{' '}
                        {formatQuantity(line?.availableQuantity ?? 0, ingredient.normalisedUnit)}
                        {ingredient.note ? ` · ${ingredient.note}` : ''}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'rounded-full border px-2 py-0.5 text-2xs font-semibold',
                        line && line.isCovered ? 'border-forest-200 bg-forest-50 text-forest-700' : 'border-clay-400/30 bg-clay-100 text-clay-500',
                      )}
                    >
                      {line?.isCovered ? 'In pantry' : `Buy ${line?.cartQuantity ?? 1} pack`}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-2 px-5 py-4">
              <Button
                icon={<ShoppingCart className="h-4 w-4" />}
                disabled={comparison.cartAdditions.length === 0}
                onClick={async () => {
                  const scaled = comparison.cartAdditions.map((line) => ({ productId: line.productId, quantity: Math.max(1, Math.ceil(line.quantity * scale)) }));
                  const count = await addManyToCart(scaled);
                  toast.success(`${count} ingredient${count === 1 ? '' : 's'} added to your cart`, 'Only the missing quantities were added.');
                }}
              >
                Add missing ingredients to cart
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const count = await addManyToCart(recipe.ingredients.map((item) => ({ productId: item.productId, quantity: Math.max(1, Math.ceil(scale)) })));
                  toast.success(`${count} ingredient${count === 1 ? '' : 's'} added`);
                }}
              >
                Add all ingredients
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Method" subtitle={`${recipe.steps.length} steps`} />
          <ol className="space-y-3 px-5 py-4">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-50 text-2xs font-semibold text-forest-700">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader title="Ingredient products" subtitle="Tap any product to open it in the shop" />
          <div className="px-5 py-4">
            <ProductGrid products={ingredients} compact />
          </div>
        </Card>
      </section>

      {recipe.swapCodes.length > 0 ? (
        <Card className="bg-sage-50 p-4">
          <p className="text-xs leading-relaxed text-sage-700">
            Healthier swaps for this recipe:{' '}
            {recipe.swapCodes.map((code) => code.replace(/-/g, ' ')).join(', ')}. Open Healthy Alternatives to compare the
            nutrition side by side.
          </p>
        </Card>
      ) : null}

      <SectionHeader title="Keep planning" subtitle="Turn this recipe into a full week of meals" action={<ButtonLink to="/meal-planner" variant="outline" size="sm">Open Meal Planner</ButtonLink>} />
    </div>
  );
}
