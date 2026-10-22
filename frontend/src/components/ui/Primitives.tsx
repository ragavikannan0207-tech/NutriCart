import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Star } from 'lucide-react';

/* ------------------------------------------------------------------ CARD --- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('rounded-2xl border border-cream-300 bg-white shadow-card', className)}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-wrap items-start justify-between gap-3 border-b border-cream-200 px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  eyebrow,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-sage-600">{eyebrow}</p> : null}
        <h2 className="text-lg font-semibold tracking-tight text-ink-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------- BADGE --- */

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-cream-200 text-ink-600 border-cream-300',
  success: 'bg-forest-50 text-forest-700 border-forest-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-clay-100 text-clay-500 border-clay-400/30',
  info: 'bg-sage-50 text-sage-700 border-sage-200',
  brand: 'bg-forest-700 text-cream-50 border-forest-700',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  icon,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        BADGE_TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- EMPTY ------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-100/60 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sage-600 shadow-card">{icon}</div>
      ) : null}
      <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------ PROGRESS ----- */

export function Progress({
  value,
  tone = 'brand',
  className,
  height = 'h-2',
}: {
  value: number;
  tone?: 'brand' | 'warning' | 'danger';
  className?: string;
  height?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tones = { brand: 'bg-forest-600', warning: 'bg-amber-500', danger: 'bg-clay-500' } as const;
  return (
    <div className={clsx('w-full overflow-hidden rounded-full bg-cream-200', height, className)}>
      <div className={clsx('h-full rounded-full transition-all duration-500', tones[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* -------------------------------------------------------------- RATING ----- */

export function Rating({ value, count, size = 'sm' }: { value: number; count?: number; size?: 'sm' | 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <Star
            key={star}
            className={clsx(
              size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5',
              star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-cream-400',
            )}
          />
        ))}
      </div>
      <span className={clsx('font-medium text-ink-600', size === 'sm' ? 'text-2xs' : 'text-xs')}>
        {value.toFixed(1)}
        {count != null ? ` (${count})` : ''}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------- STAT -------- */

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'brand' | 'warning' | 'danger';
  icon?: ReactNode;
}) {
  const tones = {
    default: 'text-ink-900',
    brand: 'text-forest-700',
    warning: 'text-amber-600',
    danger: 'text-clay-500',
  } as const;
  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        {icon ? <span className="text-sage-500">{icon}</span> : null}
      </div>
      <p className={clsx('mt-2 text-xl font-semibold tracking-tight', tones[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-ink-500">{hint}</p> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- CHIP ------ */

export function Chip({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-forest-700 bg-forest-700 text-cream-50 shadow-sm'
          : 'border-cream-300 bg-white text-ink-600 hover:border-forest-300 hover:text-forest-800',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px w-full bg-cream-200', className)} />;
}

/* --------------------------------------------------------------- TABS ------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx('flex gap-1 overflow-x-auto rounded-xl border border-cream-300 bg-white p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={clsx(
            'flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition',
            value === tab.value ? 'bg-forest-700 text-cream-50' : 'text-ink-600 hover:bg-cream-100',
          )}
        >
          {tab.label}
          {tab.count != null ? <span className="ml-1.5 opacity-70">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse-soft rounded-xl bg-cream-200', className)} />;
}

/* ------------------------------------------------------------ ACCORDION ----- */

export function Accordion({
  items,
  className,
}: {
  items: Array<{ id: string; question: string; answer: ReactNode }>;
  className?: string;
}) {
  return (
    <div className={clsx('divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-300 bg-white', className)}>
      {items.map((item) => (
        <details key={item.id} className="group px-4 py-3 transition open:bg-cream-50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink-800">
            {item.question}
            <span className="text-lg leading-none text-sage-500 transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-2 text-xs leading-relaxed text-ink-600">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ NUTRITION ----- */

export function NutritionRow({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={clsx('flex items-baseline justify-between gap-3 py-1.5 text-xs', highlight && 'font-semibold')}>
      <span className="text-ink-500">{label}</span>
      <span className={clsx('tabular-nums', highlight ? 'text-forest-700' : 'text-ink-800')}>
        {value}
        <span className="ml-0.5 text-ink-500">{unit}</span>
      </span>
    </div>
  );
}
