import { supabase } from "@/integrations/supabase/client";

const DAYS = [
  { key: "lundi", short: "Lun" },
  { key: "mardi", short: "Mar" },
  { key: "mercredi", short: "Mer" },
  { key: "jeudi", short: "Jeu" },
  { key: "vendredi", short: "Ven" },
  { key: "samedi", short: "Sam" },
  { key: "dimanche", short: "Dim" },
] as const;

/** Canonical per-day representation of a weekly schedule row. */
export function scheduleSnapshot(s: any): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const { key } of DAYS) {
    const start = s?.[`${key}_start`];
    const end = s?.[`${key}_end`];
    const bs = s?.[`${key}_break_start`];
    const be = s?.[`${key}_break_end`];
    if (!start && !end) {
      snap[key] = "";
    } else if (start === "EXT" || start === "ROULEMENT") {
      snap[key] = start;
    } else {
      snap[key] = `${start || ""}-${end || ""}${bs && be ? `|${bs}-${be}` : ""}`;
    }
  }
  return snap;
}

const formatDayValue = (v: string): string => {
  if (!v) return "—";
  if (v === "EXT") return "Extérieur";
  if (v === "ROULEMENT") return "Roulement";
  const fmt = (t: string) => (t ? t.replace(":", "h") : "");
  const [range, pause] = v.split("|");
  const [s, e] = range.split("-");
  let out = `${fmt(s)}–${fmt(e)}`;
  if (pause) {
    const [pbs, pbe] = pause.split("-");
    out += ` (table ${fmt(pbs)}–${fmt(pbe)})`;
  }
  return out;
};

interface NotifyParams {
  weekStart: string;
  storeId: string | null | undefined;
  employees: { id: string; is_active?: boolean }[];
  schedules: any[];
}

/**
 * Compares the current saved week against the last notified snapshot per
 * employee, creates a notification for each employee whose schedule changed,
 * and stores the new snapshots. Returns the number of notified employees.
 */
export async function notifyTeamWeek({ weekStart, storeId, employees, schedules }: NotifyParams): Promise<number> {
  const employeeIds = new Set(employees.filter((e) => e.is_active !== false).map((e) => e.id));
  const rows = (schedules || []).filter((s) => employeeIds.has(s.employee_id));
  if (rows.length === 0) return 0;

  const { data: existing, error: snapErr } = await supabase
    .from("notified_schedule_snapshots")
    .select("employee_id, snapshot_hash")
    .eq("week_start", weekStart)
    .in("employee_id", rows.map((r) => r.employee_id));
  if (snapErr) throw snapErr;

  const prevMap = new Map((existing || []).map((r: any) => [r.employee_id, r.snapshot_hash as string]));

  const notifications: any[] = [];
  const upserts: any[] = [];

  for (const row of rows) {
    const snap = scheduleSnapshot(row);
    const snapStr = JSON.stringify(snap);
    const prevStr = prevMap.get(row.employee_id);

    if (prevStr === snapStr) continue; // no change

    let message: string;
    if (!prevStr) {
      message = "Votre planning de la semaine a été publié.";
    } else {
      let prev: Record<string, string> = {};
      try { prev = JSON.parse(prevStr); } catch { /* ignore */ }
      const changes: string[] = [];
      for (const { key, short } of DAYS) {
        const before = prev[key] ?? "";
        const after = snap[key] ?? "";
        if (before !== after) {
          changes.push(`${short}: ${formatDayValue(before)} → ${formatDayValue(after)}`);
        }
      }
      message = changes.length > 0
        ? `Modification de votre planning — ${changes.join(" · ")}`
        : "Votre planning de la semaine a été mis à jour.";
    }

    notifications.push({
      employee_id: row.employee_id,
      store_id: storeId ?? null,
      week_start: weekStart,
      message,
    });
    upserts.push({
      employee_id: row.employee_id,
      week_start: weekStart,
      snapshot_hash: snapStr,
      notified_at: new Date().toISOString(),
    });
  }

  if (notifications.length === 0) return 0;

  const { error: notifErr } = await supabase.from("schedule_notifications").insert(notifications);
  if (notifErr) throw notifErr;

  const { error: upErr } = await supabase
    .from("notified_schedule_snapshots")
    .upsert(upserts, { onConflict: "employee_id,week_start" });
  if (upErr) throw upErr;

  return notifications.length;
}
