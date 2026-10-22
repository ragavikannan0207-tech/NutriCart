import { Link } from 'react-router-dom';
import {
  Apple,
  ArrowRight,
  Beef,
  CalendarRange,
  Carrot,
  ChefHat,
  Compass,
  Croissant,
  CupSoda,
  Dumbbell,
  Milk,
  Package,
  ShoppingBasket,
  ShoppingCart,
  Timer,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '@/types';
import { CATEGORY_ORDER, PRODUCTS, countByCategory, productsByCategory } from '@/data/products';
import { RECIPES } from '@/data/recipes';
import { effectiveStatus, sortOrdersNewestFirst } from '@/domain/orders';
import { freshnessOf } from '@/domain/pantry';
import { useAppData, useRecommendations } from '@/state/hooks';
import { FeatureBanner } from '@/components/layout/FeatureBanner';
import { ProductGrid, ProductRail } from '@/components/product/ProductGrid';
import { Badge, Card, CardHeader, EmptyState, SectionHeader } from '@/components/ui/Primitives';
import { ButtonLink } from '@/components/ui/Button';
import { formatCurrency, formatDate, formatRelative } from '@/utils/format';

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Fruits: Apple,
  Vegetables: Carrot,
  Protein: Beef,
  Grains: Croissant,
  Dairy: Milk,
  'Healthy Snacks': Package,
  'Fitness Foods': Dumbbell,
  Drinks: CupSoda,
  'Everyday Groceries': ShoppingBasket,
};

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Overview — the grocery discovery home. Deliberately a shopfront, not an
 * analytics dashboard: quick actions, aisles, personalised rails and real
 * activity with honest empty states everywhere.
 */
export function OverviewPage() {
  const { activeProfile, pricedCart, cartCount, orders, pantryItems, currentOrder } = useAppData();
  const recommendations = useRecommendations();

  const lastOrder = sortOrdersNewestFirst(orders)[0];
  const activeOrder = currentOrder;
  const expiringItems = pantryItems.filter((item) => freshnessOf(item).status !== 'Fresh');
  const pickedGroup = recommendations.find((group) => group.key === 'picked');
  const buyAgain = recommendations.find((group) => group.key === 'buy-again');
  const pantryGroup = recommendations.find((group) => group.key === 'pantry');
  const healthyPicks = PRODUCTS.filter((product) => product.stockCount > 0 && product.tags.includes('healthy snack')).slice(0, 8).map((p) => p.id);
  const recipesForYou = RECIPES.slice(0, 4);

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-sage-600">
              {activeProfile ? `Shopping for ${activeProfile.name}` : 'NutriCart'}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {greeting()}, {activeProfile?.name ?? 'there'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">Shop smart and stay on track with your nutrition goals.</p>
          </div>
          {activeProfile ? (
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="info">{activeProfile.dietType}</Badge>
              <Badge tone="success">{activeProfile.healthGoal}</Badge>
              <Badge tone="neutral">
                Budget ₹{activeProfile.budgetAmount} / {activeProfile.budgetPeriod.toLowerCase()}
              </Badge>
            </div>
          ) : null}
        </div>

        <FeatureBanner />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction to="/shop" icon={ShoppingBasket} title="Shop Groceries" subtitle={`${PRODUCTS.length} products in nine aisles`} />
        <QuickAction to="/cart" icon={ShoppingCart} title="View Cart" subtitle={cartCount > 0 ? `${cartCount} items · ${formatCurrency(pricedCart.totals.grandTotal)}` : 'Your cart is empty'} />
        <QuickAction to="/pantry" icon={Package} title="My Pantry" subtitle={pantryItems.length > 0 ? `${pantryItems.length} items tracked` : 'Track what you have at home'} />
        <QuickAction to="/meal-planner" icon={CalendarRange} title="Meal Planner" subtitle="Plan the week, buy only the gaps" />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Shop by category" subtitle="Every aisle in the NutriCart catalogue" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_ORDER.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <Link
                key={category}
                to={`/shop?category=${encodeURIComponent(category)}`}
                className="group flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-lift"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-700 transition group-hover:bg-forest-700 group-hover:text-cream-50">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink-800">{category}</span>
                  <span className="block text-2xs text-ink-500">{countByCategory(category)} products</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {activeOrder ? (
        <Card className="border-forest-200 bg-forest-50/60">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-700 text-cream-50">
                <Timer className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {activeOrder.orderNumber} · {effectiveStatus(activeOrder)}
                </p>
                <p className="text-xs text-ink-500">
                  For {activeOrder.personName} · placed {formatRelative(activeOrder.createdAt)} · {activeOrder.items.length} items · {formatCurrency(activeOrder.grandTotal)}
                </p>
              </div>
            </div>
            <ButtonLink to={`/orders/${activeOrder.id}`} size="sm" variant="secondary" icon={<ArrowRight className="h-3.5 w-3.5" />}>
              Track order
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      {pickedGroup ? <ProductRail title={`Picked for ${activeProfile?.name ?? 'You'}`} subtitle={pickedGroup.subtitle} productIds={pickedGroup.products} /> : null}
      {buyAgain ? <ProductRail title="Buy Again" subtitle={buyAgain.subtitle} productIds={buyAgain.products} /> : null}

      <ProductRail
        title="Recommended for You"
        subtitle={activeProfile ? `Matched to ${activeProfile.healthGoal.toLowerCase()}` : 'Popular right now'}
        productIds={(recommendations.find((group) => group.key === 'goal') ?? pickedGroup)?.products ?? []}
        action={
          <Link to="/for-you" className="text-xs font-semibold text-forest-700 hover:underline">
            See all
          </Link>
        }
      />

      {pantryGroup ? <ProductRail title="Use Your Pantry" subtitle={pantryGroup.subtitle} productIds={pantryGroup.products} /> : null}

      <ProductRail title="Healthy Choices" subtitle="Everyday picks with better macros" productIds={healthyPicks} />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Recipes for You"
            subtitle="Cook something that fits your goal"
            action={
              <Link to="/recipes" className="text-xs font-semibold text-forest-700 hover:underline">
                All recipes
              </Link>
            }
          />
          <ul className="divide-y divide-cream-200">
            {recipesForYou.map((recipe) => (
              <li key={recipe.id}>
                <Link to={`/recipes/${recipe.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-cream-50">
                  <img src={recipe.image} alt={recipe.name} className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-800">{recipe.name}</span>
                    <span className="block text-xs text-ink-500">
                      {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min · {recipe.calories} kcal · {recipe.protein} g protein
                    </span>
                  </span>
                  <ChefHat className="h-4 w-4 shrink-0 text-sage-500" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Pantry Alerts" subtitle="Real pantry items that need attention" />
            {expiringItems.length === 0 ? (
              <div className="px-5 py-4">
                <EmptyState compact icon={<Package className="h-4 w-4" />} title="Nothing needs attention" description="Add items to your pantry to get freshness alerts here." />
              </div>
            ) : (
              <ul className="divide-y divide-cream-200">
                {expiringItems.slice(0, 4).map((item) => {
                  const freshness = freshnessOf(item);
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink-800">{item.name}</span>
                        <span className="block text-xs text-ink-500">
                          {item.quantity} {item.unit} · expires {formatDate(item.expiryDate)}
                        </span>
                      </span>
                      <Badge tone={freshness.tone === 'danger' ? 'danger' : 'warning'}>{freshness.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="px-5 py-3">
              <ButtonLink to="/pantry" variant="outline" size="sm" fullWidth>
                Open My Pantry
              </ButtonLink>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Recent Order"
              subtitle={lastOrder ? `Placed ${formatRelative(lastOrder.createdAt)}` : 'No orders yet'}
              action={lastOrder ? <Badge tone="neutral">{effectiveStatus(lastOrder)}</Badge> : undefined}
            />
            {lastOrder ? (
              <div className="space-y-3 px-5 py-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-ink-800">{lastOrder.orderNumber}</span>
                  <span className="font-semibold text-ink-900">{formatCurrency(lastOrder.grandTotal)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lastOrder.items.slice(0, 4).map((item) => (
                    <span key={item.productId} className="rounded-lg border border-cream-300 bg-white px-2 py-1 text-2xs text-ink-600">
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                  {lastOrder.items.length > 4 ? <span className="text-2xs text-ink-500">+{lastOrder.items.length - 4} more</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink to={`/orders/${lastOrder.id}`} size="sm" variant="outline">
                    View order
                  </ButtonLink>
                  <ButtonLink to={`/orders/${lastOrder.id}/invoice`} size="sm" variant="ghost">
                    Invoice
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4">
                <EmptyState compact icon={<TrendingUp className="h-4 w-4" />} title="No orders yet" description="Start shopping to see your order history here." action={<ButtonLink to="/shop" size="sm">Shop groceries</ButtonLink>} />
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Fresh in the catalogue" subtitle="Recently added products" action={<Link to="/shop" className="text-xs font-semibold text-forest-700 hover:underline">Browse all</Link>} />
        <ProductGrid products={productsByCategory('Fruits').slice(0, 4).concat(productsByCategory('Protein').slice(0, 4))} compact />
      </section>

      <Card className="bg-sage-50">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sage-700">
              <Compass className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Shopping for your own goals too?</p>
              <p className="text-xs text-ink-500">Personal diet and workout plans are available as a service — never added to your grocery cart.</p>
            </div>
          </div>
          <ButtonLink to="/diet-plans" variant="outline" size="sm">
            See plans
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, subtitle }: { to: string; icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-lift"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-50 text-forest-700 transition group-hover:bg-forest-700 group-hover:text-cream-50">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="block truncate text-xs text-ink-500">{subtitle}</span>
      </span>
    </Link>
  );
}
