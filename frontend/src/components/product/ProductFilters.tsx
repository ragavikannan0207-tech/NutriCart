import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { ProductFilters, ProductSortKey } from '@/types';
import { CATEGORIES, DIET_TYPES, DEFAULT_PRODUCT_FILTERS } from '@/types';
import { PRICE_BOUNDS } from '@/data/products';
import { Button } from '@/components/ui/Button';
import { Chip, Divider } from '@/components/ui/Primitives';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { formatCurrency } from '@/utils/format';

export const SORT_OPTIONS: DropdownOption<ProductSortKey>[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
];

const PROTEIN_STEPS = [5, 10, 15, 20];
const CALORIE_CEILINGS = [100, 200, 300, 500];

interface ProductFilterBarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  sort: ProductSortKey;
  onSortChange: (sort: ProductSortKey) => void;
  resultCount: number;
  categoryCounts: Record<string, number>;
}

/**
 * Filters + sort for Shop Groceries. Category, diet, price, availability,
 * protein, calories and every sort option are wired to real catalogue data.
 */
export function ProductFilterBar({ filters, onChange, sort, onSortChange, resultCount, categoryCounts }: ProductFilterBarProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.category !== 'All',
    filters.diet !== 'All',
    filters.maxPrice != null,
    filters.minProtein != null,
    filters.maxCalories != null,
    filters.inStockOnly,
  ].filter(Boolean).length;

  const update = (patch: Partial<ProductFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={filters.category === 'All'} onClick={() => update({ category: 'All' })}>
          All
        </Chip>
        {CATEGORIES.map((category) => (
          <Chip key={category} active={filters.category === category} onClick={() => update({ category })}>
            {category}
            <span className="ml-1.5 opacity-60">{categoryCounts[category] ?? 0}</span>
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<SlidersHorizontal className="h-3.5 w-3.5" />} onClick={() => setOpen((current) => !current)}>
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => onChange(DEFAULT_PRODUCT_FILTERS)}>
              Clear
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-ink-500 sm:block">
            {resultCount} product{resultCount === 1 ? '' : 's'}
          </span>
          <Dropdown value={sort} options={SORT_OPTIONS} onChange={onSortChange} size="sm" label="Sort" align="right" />
        </div>
      </div>

      {open ? (
        <div className="grid animate-fade-in gap-4 rounded-2xl border border-cream-300 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Diet</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip active={filters.diet === 'All'} onClick={() => update({ diet: 'All' })}>
                Any
              </Chip>
              {DIET_TYPES.map((diet) => (
                <Chip key={diet} active={filters.diet === diet} onClick={() => update({ diet })}>
                  {diet === 'No Restriction' ? 'Both' : diet}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">
              Max price {filters.maxPrice != null ? formatCurrency(filters.maxPrice) : 'Any'}
            </p>
            <input
              type="range"
              min={20}
              max={PRICE_BOUNDS.max}
              step={10}
              value={filters.maxPrice ?? PRICE_BOUNDS.max}
              onChange={(event) => {
                const value = Number(event.target.value);
                update({ maxPrice: value >= PRICE_BOUNDS.max ? null : value });
              }}
              className="mt-3 w-full accent-forest-700"
              aria-label="Maximum price"
            />
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Minimum protein</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip active={filters.minProtein == null} onClick={() => update({ minProtein: null })}>
                Any
              </Chip>
              {PROTEIN_STEPS.map((step) => (
                <Chip key={step} active={filters.minProtein === step} onClick={() => update({ minProtein: step })}>
                  {step}+ g
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Max calories</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip active={filters.maxCalories == null} onClick={() => update({ maxCalories: null })}>
                Any
              </Chip>
              {CALORIE_CEILINGS.map((ceiling) => (
                <Chip key={ceiling} active={filters.maxCalories === ceiling} onClick={() => update({ maxCalories: ceiling })}>
                  up to {ceiling}
                </Chip>
              ))}
            </div>
          </div>

          <Divider className="sm:col-span-2 lg:col-span-4" />

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-700">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(event) => update({ inStockOnly: event.target.checked })}
              className="h-4 w-4 rounded border-cream-300 text-forest-700 focus:ring-forest-500/30"
            />
            Show only products that are in stock
          </label>
        </div>
      ) : null}
    </div>
  );
}
