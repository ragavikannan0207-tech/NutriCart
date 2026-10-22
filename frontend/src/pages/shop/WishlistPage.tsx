import { Heart, ShoppingCart } from 'lucide-react';
import { getProductById } from '@/data/products';
import { useAppData } from '@/state/hooks';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';

/** Wishlist — persisted, and every item uses the same global cart. */
export function WishlistPage() {
  const { wishlist, addWishlistToCart, cart } = useAppData();
  const products = wishlist.map((item) => getProductById(item.productId)).filter((product) => Boolean(product));

  if (products.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Wishlist</h1>
        <EmptyState
          icon={<Heart className="h-4 w-4" />}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here. Saved items stay across sessions and devices when the backend is connected."
          action={<ButtonLink to="/shop">Browse groceries</ButtonLink>}
        />
      </div>
    );
  }

  const available = products.filter((product) => product && product.stockCount > 0).map((product) => product!.id);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Wishlist</h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} saved product{products.length === 1 ? '' : 's'}
            {cart.length > 0 ? ` · ${cart.length} already in your cart` : ''}
          </p>
        </div>
        <Button
          icon={<ShoppingCart className="h-4 w-4" />}
          disabled={available.length === 0}
          onClick={() => void addWishlistToCart(available)}
        >
          Add all in-stock to cart
        </Button>
      </header>

      <ProductGrid products={products.map((product) => product!)} />
    </div>
  );
}
