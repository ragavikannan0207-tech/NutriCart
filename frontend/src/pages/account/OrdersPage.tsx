import { useMemo, useState } from 'react';
import { Receipt, RotateCcw } from 'lucide-react';
import type { Order } from '@/types';
import { effectiveStatus } from '@/domain/orders';
import { useAppData } from '@/state/hooks';
import { useNow } from '@/hooks';
import { useToast } from '@/state/ToastContext';
import { OrderCard } from '@/components/orders/OrderCard';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Card, EmptyState, StatTile, Tabs } from '@/components/ui/Primitives';
import { ButtonLink } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { friendlyMessage } from '@/utils/errors';

/** Orders — history, tracking entry point, cancellation and reorder. */
export function OrdersPage() {
  const { orders, cancelOrder, reorder } = useAppData();
  const toast = useToast();
  const now = useNow(1000);
  const [tab, setTab] = useState<'active' | 'past' | 'cancelled'>('active');
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const grouped = useMemo(() => {
    const withStatus = orders.map((order) => ({ order, status: effectiveStatus(order, now) }));
    return {
      active: withStatus.filter((entry) => entry.status !== 'Delivered' && entry.status !== 'Cancelled').map((entry) => entry.order),
      past: withStatus.filter((entry) => entry.status === 'Delivered').map((entry) => entry.order),
      cancelled: withStatus.filter((entry) => entry.status === 'Cancelled').map((entry) => entry.order),
    };
  }, [orders, now]);

  const spent = orders.filter((order) => effectiveStatus(order, now) !== 'Cancelled').reduce((sum, order) => sum + order.grandTotal, 0);
  const items = orders.filter((order) => effectiveStatus(order, now) !== 'Cancelled').reduce((sum, order) => sum + order.items.length, 0);
  const visible = grouped[tab];

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await cancelOrder(pendingCancel.id);
      toast.success('Order cancelled', 'Nothing will be charged for this order.');
      setPendingCancel(null);
    } catch (error) {
      toast.error('Could not cancel the order', friendlyMessage(error));
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      const count = await reorder(order);
      toast.success(`${count} item${count === 1 ? '' : 's'} added back to your cart`);
    } catch (error) {
      toast.error('Could not reorder', friendlyMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Orders</h1>
          <p className="mt-1 text-sm text-ink-500">Track live deliveries, download invoices and reorder in one tap.</p>
        </div>
        <ButtonLink to="/shop" variant="outline" size="sm">
          Shop groceries
        </ButtonLink>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-4 w-4" />}
          title="No orders yet"
          description="Start shopping to see your orders here. Every order you place appears with live tracking, invoice and cancellation."
          action={<ButtonLink to="/shop">Shop groceries</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total orders" value={orders.length} hint="Across every person on the account" />
            <StatTile label="Spend" value={formatCurrency(spent)} hint="Cancelled orders are excluded" />
            <StatTile label="Items bought" value={items} hint="Sum of all purchased units" />
            <StatTile label="Live now" value={grouped.active.length} hint="Orders still in delivery" tone={grouped.active.length > 0 ? 'brand' : 'default'} />
          </div>

          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'active', label: 'Active', count: grouped.active.length },
              { value: 'past', label: 'Delivered', count: grouped.past.length },
              { value: 'cancelled', label: 'Cancelled', count: grouped.cancelled.length },
            ]}
            className="max-w-md"
          />

          {visible.length === 0 ? (
            <Card className="px-5 py-8 text-center">
              <p className="text-sm font-medium text-ink-700">
                {tab === 'active' ? 'Nothing is on the way right now.' : tab === 'past' ? 'No delivered orders yet.' : 'No cancelled orders.'}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {tab === 'active' ? 'Place an order and it will appear here with live tracking.' : 'Your history is kept for invoices and reordering.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {visible.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  onCancel={(target) => setPendingCancel(target)}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this order?"
        message={`Order ${pendingCancel?.orderNumber ?? ''} will be cancelled immediately. This can only be done inside the first 60 seconds and cannot be undone.`}
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        tone="danger"
        loading={cancelling}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setPendingCancel(null)}
      />

      <Card className="flex items-start gap-3 bg-sage-50 p-4">
        <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-sage-700" />
        <p className="text-xs leading-relaxed text-sage-700">
          Reordering adds the exact same products back into your cart at today&apos;s prices, so you can adjust quantities
          before checking out.
        </p>
      </Card>
    </div>
  );
}
