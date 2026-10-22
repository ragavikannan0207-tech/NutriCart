import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, ShoppingBag, Timer } from 'lucide-react';
import { effectiveStatus } from '@/domain/orders';
import { useAppData } from '@/state/hooks';
import { useNow } from '@/hooks';
import { Card, CardHeader, EmptyState, NutritionRow } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatCountdown, formatCurrency, formatDateTime } from '@/utils/format';
import { PRICING } from '@/domain/pricing';

/** Post-checkout confirmation with the real order details and next actions. */
export function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, cancelOrder } = useAppData();
  const now = useNow(1000);
  const order = orders.find((entry) => entry.id === Number(orderId));

  if (!order) {
    return (
      <EmptyState
        title="That order is not available"
        description="Head to your orders page to see everything you have placed."
        action={<ButtonLink to="/orders" size="sm">View orders</ButtonLink>}
      />
    );
  }

  const status = effectiveStatus(order, now);
  const remaining = Math.max(0, 60_000 - (now.getTime() - new Date(order.createdAt).getTime()));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-cream-200 bg-forest-50 px-5 py-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-700 text-cream-50">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-ink-900">Order placed successfully</h1>
            <p className="text-xs text-ink-500">
              {order.orderNumber} · {status} · placed {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Detail label="Order ID" value={order.orderNumber} />
          <Detail label="ETA" value={formatDateTime(order.estimatedDeliveryAt)} />
          <Detail label="Shopping for" value={order.personName} />
          <Detail label="Payment" value={`${order.paymentMethod} · ${order.paymentReference}`} />
          <Detail
            label="Deliver to"
            value={`${order.address.line1}, ${order.address.city} — ${order.address.pincode}`}
            className="sm:col-span-2"
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Items" subtitle={`${order.items.length} products`} />
        <ul className="divide-y divide-cream-200">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 px-5 py-3">
              <img src={item.image} alt={item.name} className="h-11 w-11 rounded-xl border border-cream-300 object-cover" loading="lazy" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-800">{item.name}</span>
                <span className="block text-xs text-ink-500">
                  {item.unit} · {item.quantity} × {formatCurrency(item.unitPrice)}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-ink-900">{formatCurrency(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 px-5 py-4 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          {order.discount > 0 ? <div className="flex justify-between"><span className="text-ink-500">Discount</span><span className="text-forest-700">-{formatCurrency(order.discount)}</span></div> : null}
          <div className="flex justify-between"><span className="text-ink-500">Delivery</span><span>{order.delivery === 0 ? 'Free' : formatCurrency(order.delivery)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">GST ({Math.round(PRICING.taxRate * 100)}%)</span><span>{formatCurrency(order.tax)}</span></div>
          <div className="h-px w-full bg-cream-200" />
          <div className="flex justify-between text-base font-semibold"><span>Total paid</span><span className="text-forest-800">{formatCurrency(order.grandTotal)}</span></div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Purchased nutrition" subtitle="Nutrition provided by the groceries in this order" />
        <div className="grid gap-x-6 px-5 py-3 sm:grid-cols-2">
          <NutritionRow label="Calories" value={order.nutrition.calories} unit="kcal" highlight />
          <NutritionRow label="Protein" value={order.nutrition.protein} unit="g" highlight />
          <NutritionRow label="Carbohydrates" value={order.nutrition.carbs} unit="g" />
          <NutritionRow label="Fat" value={order.nutrition.fat} unit="g" />
          <NutritionRow label="Fibre" value={order.nutrition.fiber} unit="g" />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink to={`/orders/${order.id}`} icon={<Timer className="h-4 w-4" />}>
          Track order
        </ButtonLink>
        <ButtonLink to="/shop" variant="outline" icon={<ShoppingBag className="h-4 w-4" />}>
          Continue shopping
        </ButtonLink>
        <ButtonLink to={`/orders/${order.id}/invoice`} variant="ghost" icon={<Download className="h-4 w-4" />}>
          Download invoice
        </ButtonLink>
        {remaining > 0 && status !== 'Cancelled' ? (
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await cancelOrder(order.id);
              navigate(`/orders/${order.id}`);
            }}
          >
            Cancel ({formatCountdown(remaining)})
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm text-ink-800">{value}</p>
    </div>
  );
}
