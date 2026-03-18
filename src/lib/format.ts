/**
 * Belgian formatting utilities
 * Dates: DD/MM/YYYY
 * Times: 14h30
 */

/** Format a Date to DD/MM/YYYY */
export function formatDateBE(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/** Format a Date to DD/MM */
export function formatDateShortBE(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}

/** Format a Date to "DD month YYYY" in French */
export function formatDateLongBE(date: Date): string {
  const d = date.getDate();
  const m = date.toLocaleDateString("fr-BE", { month: "long" });
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

/** Format a Date to "DD month" in French */
export function formatDateMonthBE(date: Date): string {
  const d = date.getDate();
  const m = date.toLocaleDateString("fr-BE", { month: "long" });
  return `${d} ${m}`;
}

/** Convert "HH:MM" time string to "HHhMM" Belgian format */
export function formatTimeBE(time: string | null | undefined): string {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length < 2) return time;
  return `${parts[0]}h${parts[1]}`;
}

/** Get ISO week number from a Date */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Format a Date to ISO "YYYY-MM-DD" using LOCAL timezone (avoids UTC shift) */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
