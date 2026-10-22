/** Formatting helpers shared by every page. */

import { formatIsoDate } from '@/domain/dates';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const INR_DECIMAL = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER = new Intl.NumberFormat('en-IN');

/** ₹1,299 */
export function formatCurrency(value: number, decimals = false): string {
  const safe = Number.isFinite(value) ? value : 0;
  return decimals ? INR_DECIMAL.format(safe) : INR.format(Math.round(safe));
}

export function formatNumber(value: number, digits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return digits === 0 ? NUMBER.format(Math.round(safe)) : safe.toFixed(digits);
}

/** 1.2 kg style weights used on cards and in the pantry. */
export function formatGrams(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`;
  return `${Math.round(grams)} g`;
}

export function formatPercent(value: number, digits = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(digits)}%`;
}

/**
 * Date-only values (`YYYY-MM-DD`) are rendered as calendar dates, never as UTC
 * instants, so a meal-plan date never shifts by a day in the user's timezone.
 */
export function formatDate(iso: string | null | undefined): string {
  return formatIsoDate(iso);
}

export function formatDateShort(iso: string | null | undefined): string {
  return formatIsoDate(iso, { day: '2-digit', month: 'short' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/** "in 12 min" / "8 min ago" / "just now" — used by tracking + notifications. */
export function formatRelative(fromIso: string, now: Date = new Date()): string {
  const from = new Date(fromIso).getTime();
  if (Number.isNaN(from)) return '—';
  const diffMs = now.getTime() - from;
  const pastMinutes = Math.round(diffMs / 60000);
  if (Math.abs(pastMinutes) < 1) return 'just now';
  const future = pastMinutes < 0;
  const minutes = Math.abs(pastMinutes);
  const label =
    minutes < 60
      ? `${minutes} min`
      : minutes < 1440
        ? `${Math.round(minutes / 60)} hr`
        : `${Math.round(minutes / 1440)} day${Math.round(minutes / 1440) === 1 ? '' : 's'}`;
  return future ? `in ${label}` : `${label} ago`;
}

export function formatCountdown(milliseconds: number): string {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatMinutesToWindow(min: number, max: number): string {
  return `${min}–${max} minutes`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
