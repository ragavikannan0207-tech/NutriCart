import { Link } from 'react-router-dom';
import { ArrowRight, Download, RotateCcw, Timer } from 'lucide-react';
import type { Order } from '@/types';
import { cancellationState, effectiveStatus } from '@/domain/orders';
import { Badge, Card } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatCountdown, formatCurrency, formatDateTime, formatRelative } from '@/utils/format';

const STATUS_TONES = {
  Confirmed: 'info',
  Processing: 'info',
  Packed: 'warning',
  'Out for Delivery': 'warning',
  Delivered: 'success',
  Cancelled: 'danger',
} as const;

/** Summary card used on the Orders page and the Overview page. */
export function OrderCard({
  order,
  now,
  onCancel,
  onReorder,
}: {
  order: Order;
  now: Date;
  onCancel?: (order: Order) => void;
  onReorder?: (order: Order) => void;
}) {
  const status = effectiveStatus(order, now);
  const cancellation = cancellationState(order, now);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-5 py-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-900">{order.orderNumber}</p>
            <Badge tone={STATUS_TONES[status]}>{status}</Badge>
            {cancellation.canCancel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-clay-400/30 bg-clay-100 px-2 py-0.5 text-2xs font-semibold text-clay-500">
                <Timer className="h-3 w-3" />
                Cancel window {formatCountdown(cancellation.remainingMs)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {formatDateTime(order.createdAt)} · {formatRelative(order.createdAt, now)} · for {order.personName}
          </p>
        </div>
        <p className="text-lg font-semibold tracking-tight text-ink-900">{formatCurrency(order.grandTotal)}</p>
      </div>

      <div className="space-y-3 px-5 py-4">
        <ul className="flex flex-wrap gap-1.5">
          {order.items.slice(0, 5).map((item) => (
            <li key={item.productId} className="flex items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-2 py-1 text-2xs text-ink-600">
              <img src={item.image} alt="" className="h-5 w-5 rounded object-cover" loading="lazy" />
              {item.name} × {item.quantity}
            </li>
          ))}
          {order.items.length > 5 ? <li className="self-center text-2xs text-ink-500">+{order.items.length - 5} more</li> : null}
        </ul>

        <p className="text-xs text-ink-500">
          {order.paymentMethod} · {order.paymentReference} ·{' '}
          {status === 'Delivered' ? 'Delivered' : status === 'Cancelled' ? 'No delivery' : `ETA ${formatDateTime(order.estimatedDeliveryAt)}`}
        </p>

        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/orders/${order.id}`} size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
            Track order
          </ButtonLink>
          <ButtonLink to={`/orders/${order.id}/invoice`} size="sm" variant="outline" icon={<Download className="h-3.5 w-3.5" />}>
            Invoice
          </ButtonLink>
          {onReorder ? (
            <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => onReorder(order)}>
              Reorder
            </Button>
          ) : null}
          {onCancel && cancellation.canCancel ? (
            <Button size="sm" variant="danger" onClick={() => onCancel(order)}>
              Cancel order
            </Button>
          ) : null}
          <Link to="/shop" className="self-center text-2xs font-medium text-forest-700 hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </Card>
  );
}
