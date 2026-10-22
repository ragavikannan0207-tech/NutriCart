import { Link } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { clsx } from 'clsx';
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';
import { Badge, Rating } from '@/components/ui/Primitives';
import { formatCurrency } from '@/utils/format';

/**
 * Product artwork. Images are generated per product (see scripts/generate-assets.mjs)
 * and served from /public/products, so a card can never show a broken image.
 */
export function ProductImage({
  product,
  className,
  sizes = '200px',
}: {
  product: Product;
  className?: string;
  sizes?: string;
}) {
  return (
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      className={clsx('h-full w-full object-cover', className)}
    />
  );
}

/** − 1 + control bound to the ONE global cart. */
export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md',
  className,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const stop = (callback: () => void) => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    callback();
  };
  return (
    <div className={clsx('inline-flex items-center gap-1 rounded-xl border border-forest-200 bg-forest-50 p-0.5', className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={stop(onDecrement)}
        className={clsx(
          'flex items-center justify-center rounded-lg bg-white text-forest-700 shadow-sm transition hover:bg-forest-100',
          buttonSize,
        )}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-forest-800">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={stop(onIncrement)}
        className={clsx(
          'flex items-center justify-center rounded-lg bg-forest-700 text-cream-50 shadow-sm transition hover:bg-forest-800',
          buttonSize,
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export interface ProductCardProps {
  product: Product;
  quantity: number;
  isWishlisted: boolean;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleWishlist: () => void;
  /** Optional personalised reason line used by For You and Healthy Alternatives. */
  footnote?: string;
  compact?: boolean;
}

export function ProductCard({
  product,
  quantity,
  isWishlisted,
  onAdd,
  onIncrement,
  onDecrement,
  onToggleWishlist,
  footnote,
  compact,
}: ProductCardProps) {
  const outOfStock = product.stockCount <= 0;
  const savings = product.mrp > product.price ? product.mrp - product.price : 0;

  return (
    <article
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        outOfStock && 'opacity-80',
      )}
    >
      <button
        type="button"
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleWishlist();
        }}
        className={clsx(
          'absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur transition',
          isWishlisted ? 'border-clay-400/40 bg-white text-clay-500' : 'border-cream-300 bg-white/90 text-ink-500 hover:text-clay-500',
        )}
      >
        <Heart className={clsx('h-4 w-4', isWishlisted && 'fill-clay-500')} />
      </button>

      <Link
        to={`/shop/product/${product.id}`}
        className={clsx('relative block overflow-hidden bg-cream-100', compact ? 'aspect-[5/4]' : 'aspect-[4/3]')}
      >
        <ProductImage product={product} className="transition duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {product.isBestseller ? <Badge tone="brand">Bestseller</Badge> : null}
          {product.isNew ? <Badge tone="info">New</Badge> : null}
          {savings > 0 ? <Badge tone="warning">Save {formatCurrency(savings)}</Badge> : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-2xs font-semibold uppercase tracking-wide text-sage-600">{product.category}</p>
          <span
            className={clsx(
              'text-2xs font-semibold',
              outOfStock ? 'text-clay-500' : product.availability === 'Low Stock' ? 'text-amber-600' : 'text-forest-600',
            )}
          >
            {product.availability}
          </span>
        </div>

        <Link to={`/shop/product/${product.id}`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition group-hover:text-forest-800">
            {product.name}
          </h3>
        </Link>

        {!compact ? <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">{product.description}</p> : null}

        <Rating value={product.rating} count={product.reviewCount} />

        <p className="text-2xs font-medium text-ink-500">
          {product.protein} g protein · {product.calories} kcal <span className="opacity-70">{product.nutritionBasis}</span>
        </p>

        {footnote ? <p className="rounded-lg bg-sage-50 px-2 py-1.5 text-2xs leading-relaxed text-sage-700">{footnote}</p> : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-1.5">
          <div>
            <p className="text-base font-semibold tracking-tight text-ink-900">{formatCurrency(product.price)}</p>
            <p className="text-2xs text-ink-500">
              {product.unit}
              {savings > 0 ? <span className="ml-1.5 line-through">{formatCurrency(product.mrp)}</span> : null}
            </p>
          </div>

          {outOfStock ? (
            <span className="rounded-xl bg-cream-200 px-3 py-2 text-2xs font-semibold uppercase text-ink-500">Out of stock</span>
          ) : quantity > 0 ? (
            <QuantityStepper quantity={quantity} onIncrement={onIncrement} onDecrement={onDecrement} />
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAdd();
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest-700 px-3.5 text-xs font-semibold text-cream-50 transition hover:bg-forest-800"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
