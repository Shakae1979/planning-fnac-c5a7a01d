import { formatLocalDate } from "./format";

export const BREAK_HOURS = 1;
export const DEFAULT_TYPICAL_DAYS = 5;

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

/** Count days in a template that look like a real shift (excludes EXT/ROULEMENT/FERIE/empty). */
export function countTemplateWorkingDays(template: any | null | undefined): number {
  if (!template) return 0;
  let n = 0;
  for (const d of DAYS) {
    const s = template[`${d}_start`];
    const e = template[`${d}_end`];
    if (s && e && s !== "EXT" && s !== "ROULEMENT" && s !== "FERIE") n++;
  }
  return n;
}

/**
 * Net hours rules (Planning Fnac):
 * - 1h break deducted ONLY if a single shift >= 6h
 * - 'ROULEMENT' and 'EXT' (Extérieur) count as 0h
 * - Crédit d'heures pour absences (congé, maladie, férié sans shift) :
 *   forfait = contractHours / typicalDays (jours du template),
 *   fallback 5 jours si pas de template / pas de contrat.
 * - Pour un jour férié global sans shift saisi, on consulte ferieCredits[date].
 *   Si absent, la date est listée dans `missingFerieCredits` pour saisie manuelle.
 */
export function computeNetHours(
  schedule: any | null | undefined,
  conges: any[] | null | undefined,
  dayComments: any[] | null | undefined,
  monday: Date,
  template: any | null = null,
  contractHours: number = 0,
  ferieCredits: Map<string, number> | null = null
): {
  gross: number;
  breaks: number;
  worked: number;
  net: number;
  credited: number;
  missingFerieCredits: string[];
} {
  const sch = schedule || {};
  const cgs = conges || [];
  const dcs = dayComments || [];
  let gross = 0;
  let breakMinutes = 0;
  let credited = 0;
  const missingFerieCredits: string[] = [];

  const typicalDays = countTemplateWorkingDays(template) || DEFAULT_TYPICAL_DAYS;
  const dayCredit = contractHours > 0 ? contractHours / typicalDays : 0;

  for (let i = 0; i < DAYS.length; i++) {
    const d = DAYS[i];
    const dayDate = getDayDate(monday, i);
    const conge = cgs.find((c) => dayDate >= c.date_start && dayDate <= c.date_end);
    const isFerieDay = dcs.find((dc) => dc.day_key === d)?.is_ferie ?? false;
    const start = sch[`${d}_start`];
    const end = sch[`${d}_end`];
    const isLegacyFerie = start === "FERIE" || end === "FERIE";

    // Absence "personnelle" : congé / maladie / FERIE legacy → forfait jour
    if (conge || isLegacyFerie) {
      credited += dayCredit;
      continue;
    }

    // Férié global sans planning saisi → saisie manuelle
    if (isFerieDay && !start) {
      const manual = ferieCredits?.get(dayDate);
      if (manual !== undefined) {
        credited += manual;
      } else {
        missingFerieCredits.push(dayDate);
      }
      continue;
    }

    if (start && end && start !== "EXT" && start !== "ROULEMENT") {
      const dayGross = timeToHours(end) - timeToHours(start);
      gross += dayGross;
      if (dayGross >= 6) breakMinutes += 60;
    }
  }
  const breaks = breakMinutes / 60;
  const worked = gross - breaks;
  return { gross, breaks, worked, net: worked + credited, credited, missingFerieCredits };
}