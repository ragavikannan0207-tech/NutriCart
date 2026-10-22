import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Repeat, Search } from 'lucide-react';
import { findHealthAlternatives } from '@/domain/recommendations';
import { getProductById } from '@/data/products';
import { useAppData } from '@/state/hooks';
import { useDebouncedValue } from '@/hooks';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Badge, Card, Chip, EmptyState, SectionHeader } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';

const QUICK_SEARCHES = ['chips', 'bread', 'rice', 'soft drink', 'chocolate', 'cereal', 'peanut butter', 'paneer'];

/**
 * Healthy Alternatives — searching "chips" returns the genuine chip products in
 * the catalogue plus the curated healthier swap, and every CTA opens a real
 * product or adds it straight to the global cart.
 */
export function HealthyAlternativesPage() {
  const { addToCart, cart } = useAppData();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 200);
  const result = useMemo(() => findHealthAlternatives(debounced), [debounced]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Better swaps"
        title="Healthy Alternatives"
        subtitle="Search a food you would like a better version of. NutriCart shows what the catalogue offers and the nutrition difference."
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chips, bread, soft drink, chocolate…"
          aria-label="Search for a healthier alternative"
          className="h-11 w-full rounded-2xl border border-cream-300 bg-white pl-10 pr-3 text-sm shadow-inset focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_SEARCHES.map((term) => (
          <Chip key={term} active={query === term} onClick={() => setQuery(term)}>
            {term}
          </Chip>
        ))}
        {query ? (
          <Chip onClick={() => setQuery('')}>
            Clear
          </Chip>
        ) : null}
      </div>

      {result.curated.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader title="Recommended swaps" subtitle="Curated pairs with the nutrition win spelled out" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.curated.map((group) => {
              const product = getProductById(group.swapToProductId);
              if (!product) return null;
              const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
              return (
                <Card key={group.key} className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <span className="font-medium text-ink-700">{group.swapFrom}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span className="font-semibold text-forest-800">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt="" className="h-14 w-14 rounded-xl border border-cream-300 object-cover" loading="lazy" />
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed text-ink-600">{group.reason}</p>
                      <Badge tone="success" className="mt-1.5">
                        {group.nutritionWin}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void addToCart(product.id, 1)}>
                      {inCart > 0 ? `In cart (${inCart})` : 'Add to cart'}
                    </Button>
                    <ButtonLink to={`/shop/product/${product.id}`} size="sm" variant="outline">
                      View product
                    </ButtonLink>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {result.catalogueMatches.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader
            title={debounced ? `Catalogue matches for “${debounced}”` : 'Popular products'}
            subtitle="These are the products NutriCart actually sells for that search"
          />
          <ProductGrid products={result.catalogueMatches} />
        </section>
      ) : null}

      {result.healthierChoices.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader title="Healthier choices in the same aisle" subtitle="Better macros for the same craving" />
          <ProductGrid products={result.healthierChoices} compact />
        </section>
      ) : null}

      {result.curated.length === 0 && result.catalogueMatches.length === 0 ? (
        <EmptyState
          icon={<Repeat className="h-4 w-4" />}
          title={debounced ? `No swaps found for “${debounced}”` : 'Start typing to find a better swap'}
          description="Try chips, bread, soft drink, chocolate or cereal. Every result is a real catalogue product you can add to the same cart."
          action={<ButtonLink to="/shop" size="sm">Browse the shop</ButtonLink>}
        />
      ) : null}

      <Card className="bg-sage-50 p-4">
        <p className="text-xs leading-relaxed text-sage-700">
          Swapping one item at a time is the easiest way to improve a week of groceries.{' '}
          <Link to="/purchased-nutrition" className="font-semibold underline">
            Purchased Nutrition
          </Link>{' '}
          shows how those changes move your totals.
        </p>
      </Card>
    </div>
  );
}
