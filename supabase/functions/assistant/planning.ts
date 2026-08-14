// Helpers métier partagés avec le front (src/lib/hours.ts, src/lib/role-colors.ts).
// Gardés identiques pour que les chiffres de l'assistant collent à ceux de l'app.

export const DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export const ROLE_KEYS = [
  "responsable",
  "technique",
  "editorial",
  "stock",
  "caisse",
  "stagiaire",
] as const;

export function timeToHours(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h + (m || 0) / 60;
}

/**
 * Heures nettes (règles Planning Fnac) :
 * - pause d'1h déduite UNIQUEMENT si la journée >= 6h (sauf heure de table encodée)
 * - 'ROULEMENT' et 'EXT' (Extérieur) comptent 0h
 */
export function computeNetHours(schedule: Record<string, any> | null | undefined) {
  const sch = schedule || {};
  let gross = 0;
  let breakMinutes = 0;

  for (const d of DAYS) {
    const start = sch[`${d}_start`];
    const end = sch[`${d}_end`];
    if (start && end && start !== "EXT" && start !== "ROULEMENT") {
      const dayGross = timeToHours(end) - timeToHours(start);
      gross += dayGross;
      const bStart = sch[`${d}_break_start`];
      const bEnd = sch[`${d}_break_end`];
      if (bStart && bEnd) {
        breakMinutes += Math.max(0, timeToHours(bEnd) - timeToHours(bStart)) * 60;
      } else if (dayGross >= 6) {
        breakMinutes += 60;
      }
    }
  }
  const breaks = breakMinutes / 60;
  return { gross, breaks, net: gross - breaks };
}

export function dayHours(schedule: Record<string, any> | null | undefined, dayKey: string) {
  const sch = schedule || {};
  const start = sch[`${dayKey}_start`];
  const end = sch[`${dayKey}_end`];
  if (!start || !end) return { net: 0, start: null as string | null, end: null as string | null };
  if (start === "EXT" || start === "ROULEMENT") {
    return { net: 0, start: String(start), end: null };
  }
  const gross = timeToHours(end) - timeToHours(start);
  const bStart = sch[`${dayKey}_break_start`];
  const bEnd = sch[`${dayKey}_break_end`];
  let br = 0;
  if (bStart && bEnd) br = Math.max(0, timeToHours(bEnd) - timeToHours(bStart));
  else if (gross >= 6) br = 1;
  return {
    net: gross - br,
    start: String(start),
    end: String(end),
    break_start: bStart ?? null,
    break_end: bEnd ?? null,
  };
}

/** Lundi (YYYY-MM-DD local) de la semaine contenant `date`. */
export function mondayOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = (dt.getDay() + 6) % 7; // lundi = 0
  dt.setDate(dt.getDate() - day);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** Index 0..6 (lundi..dimanche) de la date. */
export function dayIndexOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}
