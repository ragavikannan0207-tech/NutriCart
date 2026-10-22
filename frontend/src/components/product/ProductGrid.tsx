import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { Product } from '@/types';
import { getProductById } from '@/data/products';
import { useAppDataValue } from '@/state/AppDataContext';
import { EmptyState } from '@/components/ui/Primitives';
import { ProductCard } from './ProductCard';

/**
 * A cart + wishlist aware product card.
 * Every surface (Shop, Overview, For You, Recipes, Smart Grocery, Healthy
 * Alternatives) renders this component, so all of them share the same cart and
 * the same wishlist by construction.
 */
export function ProductCardConnected({
  product,
  footnote,
  compact,
}: {
  product: Product;
  footnote?: string;
  compact?: boolean;
}) {
  const { cart, addToCart, setCartQuantity, wishlistIds, toggleWishlist } = useAppDataValue();
  const quantity = cart.find((line) => line.productId === product.id)?.quantity ?? 0;

  return (
    <ProductCard
      product={product}
      quantity={quantity}
      isWishlisted={wishlistIds.has(product.id)}
      onAdd={() => void addToCart(product.id, 1)}
      onIncrement={() => void addToCart(product.id, 1)}
      onDecrement={() => void setCartQuantity(product.id, quantity - 1)}
      onToggleWishlist={() => void toggleWishlist(product.id)}
      footnote={footnote}
      compact={compact}
    />
  );
}

export function ProductGrid({
  products,
  className,
  compact,
  footnotes,
  emptyState,
}: {
  products: Product[];
  className?: string;
  compact?: boolean;
  /** Optional map of productId -> reason line. */
  footnotes?: Record<number, string>;
  emptyState?: ReactNode;
}) {
  if (products.length === 0) {
    return (
      <div className={className}>
        {emptyState ?? (
          <EmptyState
            title="No products match those choices"
            description="Try clearing a filter, widening the price range or searching for something else."
          />
        )}
      </div>
    );
  }

  return (
    <div className={clsx('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {products.map((product) => (
        <ProductCardConnected key={product.id} product={product} compact={compact} footnote={footnotes?.[product.id]} />
      ))}
    </div>
  );
}

/** Horizontally scrolling product rail used by the Overview and For You pages. */
export function ProductRail({
  title,
  subtitle,
  action,
  productIds,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  productIds: number[];
  emptyMessage?: string;
}) {
  const products = productIds.map((id) => getProductById(id)).filter((product): product is Product => Boolean(product));
  if (products.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-[15rem] shrink-0 sm:w-[16rem]">
            <ProductCardConnected product={product} compact />
          </div>
        ))}
      </div>
      {products.length === 0 && emptyMessage ? <p className="text-xs text-ink-500">{emptyMessage}</p> : null}
    </section>
  );
}
