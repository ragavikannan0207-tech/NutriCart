import { Check, Package, Timer, Truck, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { Order } from '@/types';
import { orderProgressPercent, trackingSteps } from '@/domain/orders';
import { Progress } from '@/components/ui/Primitives';
import { formatTime } from '@/utils/format';

const STEP_ICONS = {
  Confirmed: Timer,
  Processing: Package,
  Packed: Package,
  'Out for Delivery': Truck,
  Delivered: Check,
  Cancelled: XCircle,
} as const;

/** Live tracking of a real order, driven by the stored createdAt timestamp. */
export function TrackingTimeline({ order, now }: { order: Order; now: Date }) {
  const steps = trackingSteps(order, now);
  const progress = orderProgressPercent(order, now);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Progress</span>
          <span className="font-semibold text-forest-700">{order.status === 'Cancelled' ? 'Cancelled' : `${progress}%`}</span>
        </div>
        <Progress
          value={order.status === 'Cancelled' ? 0 : progress}
          tone={order.status === 'Cancelled' ? 'danger' : progress >= 100 ? 'brand' : 'brand'}
          className="mt-2"
        />
      </div>

      <ol className="space-y-1">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.status];
          return (
            <li key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full border text-xs',
                    step.isComplete || step.isCurrent
                      ? step.status === 'Cancelled'
                        ? 'border-clay-400 bg-clay-100 text-clay-500'
                        : 'border-forest-300 bg-forest-700 text-cream-50'
                      : 'border-cream-300 bg-white text-ink-500',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {index < steps.length - 1 ? (
                  <span className={clsx('my-0.5 h-8 w-px', step.isComplete ? 'bg-forest-300' : 'bg-cream-300')} />
                ) : null}
              </div>
              <div className="pb-3">
                <p className={clsx('text-sm font-medium', step.isCurrent ? 'text-forest-800' : 'text-ink-800')}>
                  {step.label}
                  {step.isCurrent ? <span className="ml-2 rounded-full bg-forest-50 px-2 py-0.5 text-2xs font-semibold text-forest-700">Now</span> : null}
                </p>
                <p className="text-xs text-ink-500">{step.description}</p>
                {step.reachedAt ? <p className="mt-0.5 text-2xs text-ink-500">at {formatTime(step.reachedAt)}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
