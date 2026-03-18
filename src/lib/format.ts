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
