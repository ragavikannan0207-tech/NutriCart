import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { NotificationFilter } from '@/types';
import { IMPORTANT_NOTIFICATION_TYPES } from '@/types';
import { useAppData } from '@/state/hooks';
import { Badge, Card, EmptyState, Tabs } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatRelative } from '@/utils/format';

const TYPE_TONES: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  'Order Confirmed': 'info',
  'Out for Delivery': 'warning',
  Delivered: 'success',
  Cancelled: 'danger',
  'Pantry Expiring': 'warning',
  'Weekly Plan Ready': 'info',
  'Budget Warning': 'danger',
  Recommendation: 'neutral',
  System: 'neutral',
};

/** Notifications — real events only (order status, pantry expiry, budget, plans). */
export function NotificationsPage() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, removeNotification } = useAppData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const visible = useMemo(
    () =>
      notifications.filter((item) =>
        filter === 'important' ? item.isImportant || IMPORTANT_NOTIFICATION_TYPES.includes(item.type) : true,
      ),
    [notifications, filter],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">
            {unreadCount} unread · order updates, pantry expiry, budget warnings and weekly plan reminders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<CheckCheck className="h-3.5 w-3.5" />} onClick={() => void markAllNotificationsRead()} disabled={unreadCount === 0}>
            Mark all read
          </Button>
          <ButtonLink to="/settings?tab=notifications" variant="ghost" size="sm">
            Notification settings
          </ButtonLink>
        </div>
      </header>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'all', label: 'All', count: notifications.length },
          { value: 'important', label: 'Important only', count: notifications.filter((item) => item.isImportant).length },
        ]}
        className="max-sm:w-full sm:max-w-sm"
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-4 w-4" />}
          title="Nothing to read yet"
          description="Place an order, add pantry items or plan a week of meals and the relevant alerts will appear here. NutriCart never generates decorative notifications."
          action={<ButtonLink to="/shop">Shop groceries</ButtonLink>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-cream-200">
            {visible.map((item) => (
              <li key={item.id} className={clsx('flex flex-wrap items-start gap-3 px-4 py-3.5', !item.isRead && 'bg-forest-50/40')}>
                <span className={clsx('mt-1 h-2 w-2 shrink-0 rounded-full', item.isRead ? 'bg-cream-300' : 'bg-forest-600')} aria-hidden />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={async () => {
                    if (!item.isRead) await markNotificationRead(item.id);
                    navigate(item.actionPath || '/overview');
                  }}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">{item.title}</span>
                    <Badge tone={TYPE_TONES[item.type] ?? 'neutral'}>{item.type}</Badge>
                    {item.isImportant ? <Badge tone="danger">Important</Badge> : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">{item.message}</span>
                  <span className="mt-1 block text-2xs text-ink-500">{formatRelative(item.createdAt)} · open {item.actionPath}</span>
                </button>
                <div className="flex gap-1">
                  {!item.isRead ? (
                    <Button variant="ghost" size="sm" onClick={() => void markNotificationRead(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-clay-500 hover:bg-clay-100"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    aria-label="Dismiss notification"
                    onClick={() => void removeNotification(item.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
