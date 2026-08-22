// Gestion des « métiers du jour » avec plages horaires (changement de métier en cours de journée).

export interface DayRoleRow {
  employee_id: string;
  date: string;
  role: string;
  start_time?: string | null;
  end_time?: string | null;
}

export interface RoleSegment {
  role: string;
  start: string; // HH:MM
  end: string; // HH:MM
}

export const dayRoleKey = (employeeId: string, date: string) => `${employeeId}__${date}`;

export function toMin(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function toTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Regroupe les lignes par collaborateur + date. */
export function groupDayRoles(rows: DayRoleRow[] | null | undefined): Record<string, DayRoleRow[]> {
  const map: Record<string, DayRoleRow[]> = {};
  (rows || []).forEach((r) => {
    const k = dayRoleKey(r.employee_id, r.date);
    (map[k] ||= []).push(r);
  });
  Object.values(map).forEach((list) =>
    list.sort((a, b) => (toMin(a.start_time) ?? -1) - (toMin(b.start_time) ?? -1))
  );
  return map;
}

/**
 * Construit les segments de métier couvrant la totalité du shift.
 * Les trous (et l'absence de plage) retombent sur le métier principal.
 */
export function buildRoleSegments(
  rows: DayRoleRow[] | undefined,
  mainRole: string,
  shiftStart: string | null,
  shiftEnd: string | null
): RoleSegment[] {
  const s = toMin(shiftStart);
  const e = toMin(shiftEnd);
  if (s === null || e === null || e <= s) return [];
  const full: RoleSegment[] = [{ role: mainRole, start: toTime(s), end: toTime(e) }];
  if (!rows || rows.length === 0) return full;

  // Une ligne sans horaire = métier sur toute la journée (compatibilité).
  const whole = rows.find((r) => !r.start_time || !r.end_time);
  if (whole && rows.length === 1) return [{ role: whole.role, start: toTime(s), end: toTime(e) }];

  const ranges = rows
    .map((r) => ({ role: r.role, start: toMin(r.start_time), end: toMin(r.end_time) }))
    .filter((r): r is { role: string; start: number; end: number } => r.start !== null && r.end !== null && r.end > r.start)
    .map((r) => ({ role: r.role, start: Math.max(s, r.start), end: Math.min(e, r.end) }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return full;

  const out: RoleSegment[] = [];
  let cursor = s;
  for (const r of ranges) {
    if (r.start > cursor) out.push({ role: mainRole, start: toTime(cursor), end: toTime(r.start) });
    if (r.start < cursor) r.start = cursor; // sécurité anti-chevauchement
    if (r.end > r.start) {
      out.push({ role: r.role, start: toTime(r.start), end: toTime(r.end) });
      cursor = r.end;
    }
  }
  if (cursor < e) out.push({ role: mainRole, start: toTime(cursor), end: toTime(e) });

  // Fusion des segments consécutifs de même métier
  const merged: RoleSegment[] = [];
  for (const seg of out) {
    const last = merged[merged.length - 1];
    if (last && last.role === seg.role && last.end === seg.start) last.end = seg.end;
    else merged.push({ ...seg });
  }
  return merged;
}

/** Répartit les heures nettes du jour au prorata de la durée de chaque segment. */
export function splitHoursByRole(netHours: number, segments: RoleSegment[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (!netHours || segments.length === 0) return out;
  const durations = segments.map((s) => (toMin(s.end) ?? 0) - (toMin(s.start) ?? 0));
  const total = durations.reduce((a, b) => a + b, 0);
  if (total <= 0) return out;
  segments.forEach((seg, i) => {
    out[seg.role] = (out[seg.role] || 0) + (netHours * durations[i]) / total;
  });
  return out;
}

/** Liste ordonnée des métiers réellement exercés dans la journée. */
export function rolesOfDay(segments: RoleSegment[]): string[] {
  const seen: string[] = [];
  segments.forEach((s) => { if (!seen.includes(s.role)) seen.push(s.role); });
  return seen;
}
