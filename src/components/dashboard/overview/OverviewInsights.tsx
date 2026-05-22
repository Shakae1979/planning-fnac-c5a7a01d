import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, UserX, CalendarOff, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatDateBE, formatLocalDate, getDisplayName } from "@/lib/format";

type Employee = { id: string; name: string; last_name?: string | null; role: string; contract_hours: number };
type Schedule = Record<string, any> & { employee_id: string };

type Props = {
  employees: Employee[];
  schedules: Schedule[];
  coverage: Record<string, Record<number, { name: string; role: string }[]>>;
  dayKeys: readonly string[];
  weekMonday: Date;
};

const CRITICAL_ROLES = ["responsable", "caisse"] as const;
const ALERT_HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9-20h

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function OverviewInsights({ employees, schedules, coverage, dayKeys, weekMonday }: Props) {
  const { t } = useI18n();

  // ---- Occupation ----
  const totalContract = employees.reduce((s, e) => s + Number(e.contract_hours || 0), 0);
  const totalPlanned = schedules.reduce((s, sc: any) => s + Number(sc.hours_modified ?? sc.hours_base ?? 0), 0);
  const occupancy = totalContract > 0 ? Math.round((totalPlanned / totalContract) * 100) : 0;
  const occupancyLabel =
    occupancy < 90 ? t("insights.under") : occupancy > 105 ? t("insights.over") : t("insights.optimal");
  const occupancyColor =
    occupancy < 90 ? "text-destructive" : occupancy > 105 ? "text-warning" : "text-emerald-600";

  // ---- Unplanned employees ----
  const scheduledIds = new Set(schedules.map((s) => s.employee_id));
  const unplanned = employees.filter((e) => !scheduledIds.has(e.id));

  // ---- Alerts ----
  const alerts: { icon: "warn" | "info"; text: string }[] = [];
  if (unplanned.length > 0) {
    alerts.push({
      icon: "warn",
      text: `${unplanned.length} ${unplanned.length > 1 ? t("insights.unplannedPlural") : t("insights.unplannedSingular")}`,
    });
  }
  // Critical category gaps in 9-20h
  for (const role of CRITICAL_ROLES) {
    const missingSlots: string[] = [];
    for (const day of dayKeys) {
      let dayHasRole = false;
      for (const h of ALERT_HOURS) {
        if ((coverage[day]?.[h] ?? []).some((w) => w.role === role)) {
          dayHasRole = true;
          break;
        }
      }
      if (!dayHasRole) missingSlots.push(t(`day.short.${day}` as any) || day.slice(0, 3));
    }
    if (missingSlots.length > 0) {
      const roleLabel = t(`role.${role}.plural` as any) || role;
      alerts.push({
        icon: "warn",
        text: `${t("insights.noRole")} ${roleLabel}: ${missingSlots.join(", ")}`,
      });
    }
  }

  // ---- Upcoming leaves (next 7 days) ----
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const in7 = useMemo(() => addDays(today, 7), [today]);
  const empIds = useMemo(() => employees.map((e) => e.id), [employees]);

  const { data: upcoming = [] } = useQuery({
    queryKey: ["overview-upcoming-leaves", formatLocalDate(today), empIds.join(",")],
    enabled: empIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .in("employee_id", empIds)
        .lte("date_start", formatLocalDate(in7))
        .gte("date_end", formatLocalDate(today))
        .order("date_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  return (
    <div className="space-y-4">
      {/* Alerts banner */}
      {alerts.length === 0 ? (
        <div className="kpi-card flex items-center gap-2 py-3 border-l-4 border-l-emerald-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm text-muted-foreground">{t("insights.allGood")}</span>
        </div>
      ) : (
        <div className="kpi-card py-3 border-l-4 border-l-warning">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold">{t("insights.weekAlerts")}</span>
          </div>
          <ul className="space-y-1 text-sm">
            {alerts.map((a, i) => (
              <li key={i} className="text-muted-foreground">
                · {a.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mini cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Occupancy */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t("insights.occupancy")}</span>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono-data ${occupancyColor}`}>{occupancy}%</span>
            <span className={`text-xs ${occupancyColor}`}>{occupancyLabel}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${
                occupancy < 90 ? "bg-destructive" : occupancy > 105 ? "bg-warning" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(occupancy, 130)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            {totalPlanned}h / {totalContract}h
          </div>
        </div>

        {/* Unplanned */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t("insights.unplannedTitle")}</span>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className={`text-2xl font-bold font-mono-data ${unplanned.length > 0 ? "text-destructive" : "text-emerald-600"}`}>
            {unplanned.length}
          </span>
          {unplanned.length === 0 ? (
            <div className="text-xs text-muted-foreground mt-1.5">{t("insights.allPlanned")}</div>
          ) : (
            <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
              {unplanned.slice(0, 3).map((e) => (
                <li key={e.id} className="truncate">· {getDisplayName(e as any)}</li>
              ))}
              {unplanned.length > 3 && <li className="italic">+ {unplanned.length - 3}…</li>}
            </ul>
          )}
        </div>

        {/* Upcoming leaves 7d */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t("insights.upcomingLeaves")}</span>
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-bold font-mono-data">{upcoming.length}</span>
          {upcoming.length === 0 ? (
            <div className="text-xs text-muted-foreground mt-1.5">{t("insights.noLeaves")}</div>
          ) : (
            <ul className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
              {upcoming.slice(0, 3).map((c: any) => {
                const emp = empById.get(c.employee_id);
                const name = emp ? getDisplayName(emp as any) : "—";
                const typeShort = t(`leave.${c.type}.short` as any) || c.type;
                return (
                  <li key={c.id} className="truncate">
                    · {name} <span className="opacity-70">({typeShort})</span> {formatDateBE(new Date(c.date_start))}→{formatDateBE(new Date(c.date_end))}
                  </li>
                );
              })}
              {upcoming.length > 3 && <li className="italic">+ {upcoming.length - 3}…</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}