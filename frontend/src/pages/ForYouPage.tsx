import { Compass } from 'lucide-react';
import { getProductById } from '@/data/products';
import { useAppData, useRecommendations } from '@/state/hooks';
import { ProductRail, ProductGrid } from '@/components/product/ProductGrid';
import { Badge, Card, EmptyState, SectionHeader } from '@/components/ui/Primitives';
import { ButtonLink } from '@/components/ui/Button';

/**
 * For You — personalised discovery built only from real activity: orders,
 * pantry, wishlist, diet, goal, allergies, preferences and budget. With no
 * history at all the page says so instead of inventing purchases.
 */
export function ForYouPage() {
  const { activeProfile, orders, pantryItems, wishlist } = useAppData();
  const groups = useRecommendations();
  const hasHistory = orders.length > 0 || pantryItems.length > 0 || wishlist.length > 0;
  const picked = groups.find((group) => group.key === 'picked');

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Personalised discovery"
        title={activeProfile ? `For ${activeProfile.name}` : 'For You'}
        subtitle={
          activeProfile
            ? `Built from ${orders.length} order${orders.length === 1 ? '' : 's'}, ${pantryItems.length} pantry item${pantryItems.length === 1 ? '' : 's'}, ${wishlist.length} wishlist item${wishlist.length === 1 ? '' : 's'}, a ${activeProfile.dietType.toLowerCase()} diet and the goal “${activeProfile.healthGoal}”.`
            : 'Sign in and create a person profile to personalise this page.'
        }
        action={<ButtonLink to="/shop" variant="outline" size="sm">Shop groceries</ButtonLink>}
      />

      {!hasHistory ? (
        <EmptyState
          icon={<Compass className="h-4 w-4" />}
          title="Start shopping to personalize your recommendations"
          description="Once you place an order, save items to your wishlist or add groceries to your pantry, this page fills with picks that are genuinely yours. We never invent a purchase history."
          action={<ButtonLink to="/shop">Start shopping</ButtonLink>}
        />
      ) : null}

      {activeProfile ? (
        <div className="flex flex-wrap gap-1.5">
          {activeProfile.allergies.length > 0 ? (
            <Badge tone="warning">Avoiding {activeProfile.allergies.join(', ')}</Badge>
          ) : null}
          {activeProfile.foodPreferences.map((preference) => (
            <Badge key={preference} tone="info">
              Prefers {preference}
            </Badge>
          ))}
        </div>
      ) : null}

      {picked ? <ProductGrid products={picked.products.map((id) => getProductById(id)).filter((p) => Boolean(p)).map((p) => p!)} /> : null}

      {groups
        .filter((group) => group.key !== 'picked')
        .map((group) => (
          <ProductRail key={group.key} title={group.title} subtitle={group.subtitle} productIds={group.products} />
        ))}

      {groups.length <= 1 ? (
        <Card className="bg-sage-50 p-4">
          <p className="text-xs leading-relaxed text-sage-700">
            Recommendations refresh automatically after every order, pantry update, wishlist change or profile edit.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
