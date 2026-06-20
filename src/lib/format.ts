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

/** Get ISO week-year (may differ from civil year near Jan 1 / Dec 31) */
export function getISOYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/** Number of ISO weeks in a given ISO week-year (52 or 53) */
export function isoWeeksInYear(isoYear: number): number {
  // Dec 28 is always in the last ISO week of its ISO year
  return getWeekNumber(new Date(isoYear, 11, 28));
}

/** Get the Monday (local) of a given ISO week + year */
export function getMondayFromISOWeek(week: number, year: number): Date {
  // ISO: week 1 contains Jan 4
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // 1..7 (Mon..Sun)
  const mondayOfWeek1 = new Date(year, 0, 4 - (jan4Day - 1));
  const target = new Date(mondayOfWeek1);
  target.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  target.setHours(0, 0, 0, 0);
  return target;
}

/** Get the Monday (local) of the ISO week containing the given date */
export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Number of whole weeks between two Mondays (b - a) */
export function weeksBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
}

/** Format a Date to ISO "YYYY-MM-DD" using LOCAL timezone (avoids UTC shift) */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Build display name from first name + optional last name */
export function getDisplayName(emp: { name: string; last_name?: string | null }): string {
  return [emp.name, emp.last_name].filter(Boolean).join(" ");
}

/** Sort employees by role order, then custom sort_order, then name. */
export function sortByRoleOrder<T extends { role: string; name: string; sort_order?: number | null }>(
  list: T[],
  roleOrder: string[]
): T[] {
  return [...list].sort((a, b) => {
    const ra = roleOrder.indexOf(a.role);
    const rb = roleOrder.indexOf(b.role);
    const orderA = ra === -1 ? roleOrder.length : ra;
    const orderB = rb === -1 ? roleOrder.length : rb;
    if (orderA !== orderB) return orderA - orderB;
    const soA = a.sort_order ?? 0;
    const soB = b.sort_order ?? 0;
    if (soA !== soB) return soA - soB;
    return a.name.localeCompare(b.name, "fr");
  });
}
