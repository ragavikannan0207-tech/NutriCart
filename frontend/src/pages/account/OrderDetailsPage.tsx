import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Package, RotateCcw, Timer, Truck } from 'lucide-react';
import { cancellationState, effectiveStatus } from '@/domain/orders';
import { useAppData } from '@/state/hooks';
import { useNow } from '@/hooks';
import { useToast } from '@/state/ToastContext';
import { TrackingTimeline } from '@/components/orders/TrackingTimeline';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Badge, Card, CardHeader, EmptyState, NutritionRow } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatCountdown, formatCurrency, formatDateTime, formatRelative } from '@/utils/format';
import { friendlyMessage } from '@/utils/errors';

/** Order details + live tracking + the 60 second cancellation window. */
export function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, cancelOrder, reorder, addProductsToPantry } = useAppData();
  const toast = useToast();
  const now = useNow(1000);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, setWorking] = useState(false);

  const order = orders.find((entry) => entry.id === Number(orderId));

  if (!order) {
    return (
      <EmptyState
        title="We could not find that order"
        description="It may belong to a different account or no longer exists."
        action={<ButtonLink to="/orders" size="sm">Back to orders</ButtonLink>}
      />
    );
  }

  const status = effectiveStatus(order, now);
  const cancellation = cancellationState(order, now);

  return (
    <div className="space-y-5">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-forest-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{order.orderNumber}</h1>
            <Badge tone={status === 'Cancelled' ? 'danger' : status === 'Delivered' ? 'success' : 'warning'}>{status}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Placed {formatDateTime(order.createdAt)} · for {order.personName} · {order.items.length} products
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/orders/${order.id}/invoice`} variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />}>
            Download invoice
          </ButtonLink>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={async () => {
              const count = await reorder(order);
              toast.success(`${count} item${count === 1 ? '' : 's'} added to your cart`);
              navigate('/cart');
            }}
          >
            Reorder
          </Button>
          {cancellation.canCancel ? (
            <Button variant="danger" size="sm" icon={<Timer className="h-3.5 w-3.5" />} onClick={() => setConfirmOpen(true)}>
              Cancel ({formatCountdown(cancellation.remainingMs)})
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Live tracking" subtitle="Updates automatically from the order timestamp" />
            <div className="px-5 py-4">
              <TrackingTimeline order={order} now={now} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Items" subtitle={`${order.items.length} products in this order`} />
            <ul className="divide-y divide-cream-200">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 px-5 py-3">
                  <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl border border-cream-300 object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/shop/product/${item.productId}`} className="block truncate text-sm font-medium text-ink-800 hover:text-forest-800">
                      {item.name}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {item.unit} · {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-ink-900">{formatCurrency(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 px-5 py-3">
              <Button
                variant="outline"
                size="sm"
                icon={<Package className="h-3.5 w-3.5" />}
                onClick={async () => {
                  const added = await addProductsToPantry(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
                  toast.success(`${added} item${added === 1 ? '' : 's'} added to your pantry`);
                }}
              >
                Add items to pantry
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Nutrition in this order" subtitle="Nutrition provided by the groceries purchased — not what was eaten" />
            <div className="grid gap-x-6 px-5 py-3 sm:grid-cols-2">
              <NutritionRow label="Calories" value={order.nutrition.calories} unit="kcal" highlight />
              <NutritionRow label="Protein" value={order.nutrition.protein} unit="g" highlight />
              <NutritionRow label="Carbohydrates" value={order.nutrition.carbs} unit="g" />
              <NutritionRow label="Fat" value={order.nutrition.fat} unit="g" />
              <NutritionRow label="Fibre" value={order.nutrition.fiber} unit="g" />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Delivery" subtitle={order.address.label} />
            <div className="space-y-2 px-5 py-4 text-sm">
              <p className="font-medium text-ink-800">{order.address.recipientName}</p>
              <p className="text-xs leading-relaxed text-ink-500">
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ''}
                <br />
                {order.address.city}, {order.address.state} — {order.address.pincode}
                <br />
                Phone {order.address.phone}
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-cream-100 px-3 py-2 text-2xs text-ink-600">
                <Truck className="h-3.5 w-3.5 text-sage-600" />
                {status === 'Delivered'
                  ? `Delivered ${formatRelative(order.deliveredAt ?? order.updatedAt, now)}`
                  : status === 'Cancelled'
                    ? 'Delivery cancelled'
                    : `ETA ${formatDateTime(order.estimatedDeliveryAt)}`}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment" />
            <div className="space-y-2 px-5 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Method</span>
                <span className="font-medium text-ink-800">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Reference</span>
                <span className="font-medium text-ink-800">{order.paymentReference}</span>
              </div>
              <div className="h-px w-full bg-cream-200" />
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="text-ink-800">{formatCurrency(order.subtotal)}</span></div>
              {order.discount > 0 ? <div className="flex justify-between"><span className="text-ink-500">Discount</span><span className="text-forest-700">-{formatCurrency(order.discount)}</span></div> : null}
              <div className="flex justify-between"><span className="text-ink-500">Delivery</span><span className="text-ink-800">{order.delivery === 0 ? 'Free' : formatCurrency(order.delivery)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">GST</span><span className="text-ink-800">{formatCurrency(order.tax)}</span></div>
              <div className="h-px w-full bg-cream-200" />
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="text-forest-800">{formatCurrency(order.grandTotal)}</span></div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this order?"
        message={`${order.orderNumber} will be cancelled immediately. Cancellation is only possible within 60 seconds of placing the order.`}
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        tone="danger"
        loading={working}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setWorking(true);
          try {
            await cancelOrder(order.id);
            toast.success('Order cancelled');
            setConfirmOpen(false);
          } catch (error) {
            toast.error('Could not cancel the order', friendlyMessage(error));
          } finally {
            setWorking(false);
          }
        }}
      />
    </div>
  );
}
