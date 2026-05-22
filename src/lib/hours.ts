import { formatLocalDate } from "./format";

export const BREAK_HOURS = 1;

export function timeToHours(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

export function getDayDate(monday: Date, offset: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + offset);
  return formatLocalDate(d);
}

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

/**
 * Net hours rules (Planning Fnac):
 * - 1h break deducted ONLY if a single shift >= 6h
 * - 'ROULEMENT' and 'EXT' (Extérieur) count as 0h
 * - Les absences (congé, maladie, férié) ne génèrent AUCUNE heure.
 *   L'écart se calcule strictement sur les heures réellement prestées vs contrat.
 */
export function computeNetHours(
  schedule: any | null | undefined,
  _conges?: any[] | null,
  _dayComments?: any[] | null,
  _monday?: Date,
  _template?: any | null,
  _contractHours?: number
): {
  gross: number;
  breaks: number;
  worked: number;
  net: number;
} {
  const sch = schedule || {};
  let gross = 0;
  let breakMinutes = 0;

  for (let i = 0; i < DAYS.length; i++) {
    const d = DAYS[i];
    const start = sch[`${d}_start`];
    const end = sch[`${d}_end`];

    if (start && end && start !== "EXT" && start !== "ROULEMENT") {
      const dayGross = timeToHours(end) - timeToHours(start);
      gross += dayGross;
      if (dayGross >= 6) breakMinutes += 60;
    }
  }
  const breaks = breakMinutes / 60;
  const worked = gross - breaks;
  return { gross, breaks, worked, net: worked };
}