import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import type { Category, ProductFilters, ProductSortKey } from '@/types';
import { CATEGORIES, DEFAULT_PRODUCT_FILTERS } from '@/types';
import { PRODUCTS, allCategoriesOf, searchProducts } from '@/data/products';
import { useAppData } from '@/state/hooks';
import { useDebouncedValue } from '@/hooks';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilterBar } from '@/components/product/ProductFilters';
import { EmptyState, Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

/**
 * Shop Groceries — the core e-commerce browsing experience.
 * Search is case-insensitive and partial across name, category, tags and
 * keywords, and every filter and sort option is wired to the catalogue.
 */
export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const { activeProfile } = useAppData();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [filters, setFilters] = useState<ProductFilters>({
    ...DEFAULT_PRODUCT_FILTERS,
    category: (params.get('category') as Category | null) ?? 'All',
  });
  const [sort, setSort] = useState<ProductSortKey>('relevance');
  const debouncedQuery = useDebouncedValue(query, 200);

  useEffect(() => {
    setQuery(params.get('q') ?? '');
    const category = params.get('category') as Category | null;
    if (category) setFilters((current) => ({ ...current, category }));
  }, [params]);

  const results = useMemo(
    () => searchProducts({ query: debouncedQuery, filters, sort }),
    [debouncedQuery, filters, sort],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of CATEGORIES) {
      counts[category] = PRODUCTS.filter((product) => allCategoriesOf(product).includes(category) && product.stockCount > 0).length;
    }
    return counts;
  }, []);

  const usingDietHint = activeProfile && activeProfile.allergies.length > 0;

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Shop Groceries</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-500">
              Fresh produce, protein, grains and better-for-you snacks — {PRODUCTS.length} products across nine aisles.
            </p>
          </div>
          {activeProfile ? (
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="info">Shopping for {activeProfile.name}</Badge>
              <Badge tone="success">{activeProfile.dietType}</Badge>
              {usingDietHint ? <Badge tone="warning">Avoids {activeProfile.allergies.join(', ')}</Badge> : null}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setParams((current) => {
                const next = new URLSearchParams(current);
                if (event.target.value) next.set('q', event.target.value);
                else next.delete('q');
                return next;
              });
            }}
            placeholder="Search for chicken, chips, protein, rice, bread…"
            aria-label="Search the catalogue"
            className="h-11 w-full rounded-2xl border border-cream-300 bg-white pl-10 pr-10 text-sm shadow-inset transition placeholder:text-ink-500/60 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setParams((current) => {
                  const next = new URLSearchParams(current);
                  next.delete('q');
                  return next;
                });
              }}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-500 transition hover:bg-cream-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <ProductFilterBar
          filters={filters}
          onChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          resultCount={results.length}
          categoryCounts={categoryCounts}
        />
      </header>

      {debouncedQuery ? (
        <p className="text-xs text-ink-500">
          {results.length} result{results.length === 1 ? '' : 's'} for <span className="font-semibold text-ink-700">“{debouncedQuery}”</span>
        </p>
      ) : null}

      <ProductGrid
        products={results}
        emptyState={
          <EmptyState
            title={debouncedQuery ? `Nothing matched “${debouncedQuery}”` : 'No products match those filters'}
            description="Try a different word, clear the filters, or look at Healthy Alternatives for a better swap."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(DEFAULT_PRODUCT_FILTERS);
                  setQuery('');
                  setParams(new URLSearchParams());
                }}
              >
                Reset search and filters
              </Button>
            }
          />
        }
      />
    </div>
  );
}
