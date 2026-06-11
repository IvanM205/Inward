/**
 * Local time formatting (03 preamble: timestamps are ISO-8601 local with
 * offset). The scoring engine and repos never read the system clock — callers
 * pass `Date`s in, so tests control time completely.
 */

function pad(n: number, width = 2): string {
  return String(Math.abs(n)).padStart(width, '0');
}

/** ISO-8601 local with offset, e.g. "2026-06-11T21:30:05+02:00". */
export function toLocalIso(d: Date): string {
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(Math.abs(offsetMin) / 60))}:${pad(Math.abs(offsetMin) % 60)}`
  );
}

/** Local calendar date key, e.g. "2026-06-11" (Reflection.date, daily caps). */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The date key `days` calendar days before `d` (window cutoffs: 14/28/90 d). */
export function dateKeyDaysAgo(d: Date, days: number): string {
  const earlier = new Date(d.getFullYear(), d.getMonth(), d.getDate() - days);
  return localDateKey(earlier);
}
