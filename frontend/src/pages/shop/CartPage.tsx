import { Link } from 'react-router-dom';
import { AlertTriangle, Heart, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { getProductById } from '@/data/products';
import { PRICING } from '@/domain/pricing';
import { useAppData } from '@/state/hooks';
import { Card, CardHeader, EmptyState, Progress, Badge } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/product/ProductCard';
import { formatCurrency } from '@/utils/format';

/** Cart — one global cart for every module in NutriCart. */
export function CartPage() {
  const { pricedCart, setCartQuantity, removeFromCart, clearCart, wishlistIds, toggleWishlist, activeProfile } = useAppData();
  const { lines, totals } = pricedCart;

  if (lines.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Your Cart</h1>
        <EmptyState
          icon={<ShoppingCart className="h-4 w-4" />}
          title="Your cart is empty"
          description="Add groceries from the Shop, a recipe, your pantry shortfall, the meal planner or a Smart Grocery basket — they all land in this one cart."
          action={<ButtonLink to="/shop">Shop groceries</ButtonLink>}
        />
      </div>
    );
  }

  const deliveryProgress = Math.min(100, Math.round((totals.subtotal / totals.freeDeliveryThreshold) * 100));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Your Cart</h1>
          <p className="mt-1 text-sm text-ink-500">
            {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
            {activeProfile ? ` for ${activeProfile.name}` : ''} · {lines.length} product{lines.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => void clearCart()}>
          Empty cart
        </Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <ul className="divide-y divide-cream-200">
            {lines.map((line) => {
              const product = getProductById(line.productId);
              return (
                <li key={line.productId} className="flex flex-wrap items-center gap-4 p-4">
                  <Link to={`/shop/product/${line.productId}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-cream-300 bg-cream-100">
                    <img src={line.image} alt={line.name} className="h-full w-full object-cover" loading="lazy" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link to={`/shop/product/${line.productId}`} className="block truncate text-sm font-semibold text-ink-900 hover:text-forest-800">
                      {line.name}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {line.unit} · {line.category}
                    </p>
                    {product && product.stockCount < line.quantity ? (
                      <p className="mt-1 flex items-center gap-1 text-2xs font-medium text-clay-500">
                        <AlertTriangle className="h-3 w-3" /> Only {product.stockCount} left in stock
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <QuantityStepper
                      quantity={line.quantity}
                      onIncrement={() => void setCartQuantity(line.productId, line.quantity + 1)}
                      onDecrement={() => void setCartQuantity(line.productId, line.quantity - 1)}
                    />
                    <p className="w-20 text-right text-sm font-semibold tabular-nums text-ink-900">{formatCurrency(line.lineTotal)}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Heart className={wishlistIds.has(line.productId) ? 'h-3.5 w-3.5 fill-clay-500 text-clay-500' : 'h-3.5 w-3.5'} />}
                      onClick={() => void toggleWishlist(line.productId)}
                      aria-label={`Toggle wishlist for ${line.name}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-clay-500 hover:bg-clay-100"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => void removeFromCart(line.productId)}
                      aria-label={`Remove ${line.name}`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Order summary" subtitle="Delivery, GST and any quantity discount are applied automatically" />
            <div className="space-y-3 px-5 py-4">
              {totals.freeDeliveryRemaining > 0 ? (
                <div className="rounded-xl border border-cream-300 bg-cream-100 p-3">
                  <p className="flex items-center gap-2 text-2xs font-medium text-ink-600">
                    <Truck className="h-3.5 w-3.5 text-sage-600" />
                    Add {formatCurrency(totals.freeDeliveryRemaining)} more for free delivery
                  </p>
                  <Progress value={deliveryProgress} className="mt-2" height="h-1.5" />
                </div>
              ) : (
                <Badge tone="success" icon={<Truck className="h-3 w-3" />}>
                  Free delivery unlocked
                </Badge>
              )}

              <dl className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
                {totals.discount > 0 ? (
                  <Row label={`Quantity discount (${totals.discountPercent}%)`} value={`-${formatCurrency(totals.discount)}`} tone="success" />
                ) : null}
                <Row label="Delivery" value={totals.delivery === 0 ? 'Free' : formatCurrency(totals.delivery)} />
                <Row label={`GST (${Math.round(PRICING.taxRate * 100)}%)`} value={formatCurrency(totals.tax)} />
              </dl>

              <div className="h-px w-full bg-cream-200" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink-900">Grand total</span>
                <span className="text-xl font-semibold tracking-tight text-forest-800">{formatCurrency(totals.grandTotal)}</span>
              </div>

              <ButtonLink to="/checkout" fullWidth size="lg">
                Proceed to checkout
              </ButtonLink>
              <ButtonLink to="/shop" variant="outline" fullWidth size="sm">
                Continue shopping
              </ButtonLink>
              <p className="text-center text-2xs text-ink-500">
                Spend {formatCurrency(PRICING.discountTiers[1].minSubtotal)} to unlock {PRICING.discountTiers[1].percent}% off, or{' '}
                {formatCurrency(PRICING.discountTiers[0].minSubtotal)} for {PRICING.discountTiers[0].percent}%.
              </p>
            </div>
          </Card>

          {totals.discount === 0 ? (
            <Card className="bg-sage-50 p-4">
              <p className="text-xs leading-relaxed text-sage-700">
                Spending {formatCurrency(Math.max(0, PRICING.discountTiers[1].minSubtotal - totals.subtotal))} more unlocks a{' '}
                {PRICING.discountTiers[1].percent}% quantity discount on this order.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className={tone === 'success' ? 'font-medium text-forest-700' : 'font-medium text-ink-800'}>{value}</dd>
    </div>
  );
}
