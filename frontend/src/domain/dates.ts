/**
 * Local calendar date helpers.
 *
 * NutriCart stores plain calendar dates (`YYYY-MM-DD`) — pantry purchase and expiry
 * dates, meal-plan week starts, budget periods. Those are *not* instants: they are
 * the same date for everybody regardless of timezone. Parsing them with `new Date()`
 * (which treats `2026-10-19` as UTC midnight) and then reading them back with
 * `toISOString()` shifts them by a day in every timezone that is not UTC — a plan
 * for Monday 19 Oct would render as Sunday 18 Oct for users in IST, Europe or the
 * Americas.
 *
 * Every helper here therefore works on calendar parts directly and never crosses
 * the UTC boundary for a date-only value.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/** Splits a `YYYY-MM-DD` string into its calendar parts. */
export function parseIsoDate(isoDate: string): CalendarDate | null {
  const match = ISO_DATE_PATTERN.exec(isoDate.trim().slice(0, 10));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!month || !day || month > 12 || day > 31) return null;
  return { year, month, day };
}

/** True when the value is a plain `YYYY-MM-DD` calendar date. */
export function isIsoDate(value: string | null | undefined): boolean {
  return typeof value === 'string' && parseIsoDate(value) !== null;
}

/**
 * The calendar date of `now` in the browser's own timezone.
 * `new Date().toISOString().slice(0, 10)` would return the *UTC* date, which is
 * the previous evening for anyone east of Greenwich.
 */
export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calendar arithmetic on a `YYYY-MM-DD` date:
 * {@code addDays('2026-10-05', 3)} is always {@code '2026-10-08'}.
 *
 * <p>Implemented with {@link Date#UTC} on purpose. Building a local midnight
 * (`new Date('2026-10-05T00:00:00')`) and then reading `toISOString()` shifts the
 * result back into UTC, which truncated to a date lands one day earlier in any
 * timezone ahead of UTC (Europe, India, …) — the estimated pantry expiry date would
 * have been wrong by a day for those users. This mirrors `LocalDate.plusDays`,
 * which is what the Spring Boot backend does.
 */
export function addDays(isoDate: string, days: number): string {
  const parts = parseIsoDate(isoDate);
  if (!parts) return isoDate;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days)).toISOString().slice(0, 10);
}

/** Whole days from one calendar date to another (`to - from`). */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  if (!from || !to) return 0;
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/**
 * The Monday that starts the week containing `now`, in the browser's timezone.
 * Weeks run Monday → Sunday, matching `java.time.DayOfWeek` on the backend.
 */
export function startOfWeekIso(now: Date = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return todayIso(date);
}

/** The Monday that starts the week containing the given calendar date. */
export function weekStartOf(isoDate: string): string {
  const parts = parseIsoDate(isoDate);
  if (!parts) return isoDate;
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDays(isoDate, diff);
}

/**
 * The seven calendar dates of a week, Monday first.
 *
 * <p>Pure calendar arithmetic — no `Date` object, no timezone conversion — so the
 * first entry is always exactly the given week start and the last is always six
 * days later, in every timezone.
 */
export function weekDates(weekStart: string): string[] {
  const start = weekStartOf(weekStart);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/**
 * Formats a calendar date for display without a timezone shift.
 * Date-only values (`YYYY-MM-DD`) are rendered as-is; anything else is treated as
 * an instant and formatted in the browser's timezone.
 */
export function formatIsoDate(
  iso: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  if (!iso) return '—';
  const parts = parseIsoDate(iso);
  if (parts) {
    const local = new Date(parts.year, parts.month - 1, parts.day);
    if (Number.isNaN(local.getTime())) return '—';
    return local.toLocaleDateString('en-IN', options);
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', options);
}
