import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CalendarOff, Gauge, Users2 } from "lucide-react";
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
const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"] as const;

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
  const diffHours = totalPlanned - totalContract;

  // ---- Unplanned employees (full list, sorted by role hierarchy) ----
  const scheduledIds = new Set(schedules.map((s) => s.employee_id));
  const unplanned = employees
    .filter((e) => !scheduledIds.has(e.id))
    .sort((a, b) => {
      const ra = ROLE_ORDER.indexOf(a.role as any);
      const rb = ROLE_ORDER.indexOf(b.role as any);
      const oa = ra === -1 ? 999 : ra;
      const ob = rb === -1 ? 999 : rb;
      if (oa !== ob) return oa - ob;
      return getDisplayName(a as any).localeCompare(getDisplayName(b as any), "fr");
    });

  // ---- Headcount per department ----
  const headcountByRole = ROLE_ORDER.map((role) => ({
    role,
    total: employees.filter((e) => e.role === role).length,
    planned: employees.filter((e) => e.role === role && scheduledIds.has(e.id)).length,
  })).filter((r) => r.total > 0);

  // ---- Alerts ----
  type Alert = { kind: "unplanned" | "role-gap"; text: string; detail?: string };
  const alerts: Alert[] = [];

  if (unplanned.length > 0) {
    const label = unplanned.length > 1 ? t("insights.unplannedPlural") : t("insights.unplannedSingular");
    const names = unplanned
      .map((e) => {
        const roleShort = t(`role.${e.role}.short` as any) || e.role;
        return `${getDisplayName(e as any)} (${roleShort})`;
      })
      .join(" · ");
    alerts.push({
      kind: "unplanned",
      text: `${unplanned.length} ${label}`,
      detail: names,
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
        kind: "role-gap",
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
      {/* Top row: alerts (2/3) + upcoming leaves (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {alerts.length === 0 ? (
          <div className="kpi-card lg:col-span-2 flex items-center gap-2 py-3 border-l-4 border-l-emerald-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">{t("insights.allGood")}</span>
          </div>
        ) : (
          <div className="kpi-card lg:col-span-2 py-3 border-l-4 border-l-warning">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold">{t("insights.weekAlerts")}</span>
            </div>
            <ul className="space-y-1.5 text-sm">
              {alerts.map((a, i) => (
                <li key={i} className="text-muted-foreground">
                  <div>· <span className="font-medium text-foreground">{a.text}</span></div>
                  {a.detail && (
                    <div className="ml-3 text-xs opacity-80 leading-relaxed">{a.detail}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upcoming leaves 7d */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t("insights.upcomingLeaves")}</span>
            </div>
            <span className="text-lg font-bold font-mono-data">{upcoming.length}</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-xs text-muted-foreground">{t("insights.noLeaves")}</div>
          ) : (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {upcoming.slice(0, 6).map((c: any) => {
                const emp = empById.get(c.employee_id);
                const name = emp ? getDisplayName(emp as any) : "—";
                const typeShort = t(`leave.${c.type}.short` as any) || c.type;
                return (
                  <li key={c.id} className="truncate">
                    · <span className="text-foreground">{name}</span>{" "}
                    <span className="opacity-70">({typeShort})</span>{" "}
                    {formatDateBE(new Date(c.date_start))}→{formatDateBE(new Date(c.date_end))}
                  </li>
                );
              })}
              {upcoming.length > 6 && <li className="italic">+ {upcoming.length - 6}…</li>}
            </ul>
          )}
        </div>
      </div>

      {/* Bottom row: occupancy + by department */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>{totalPlanned}h / {totalContract}h</span>
            <span className={diffHours === 0 ? "" : diffHours > 0 ? "text-warning" : "text-destructive"}>
              {diffHours > 0 ? "+" : ""}{diffHours}h
            </span>
          </div>
        </div>

        {/* Headcount by department */}
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t("insights.byDepartment")}</span>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </div>
          {headcountByRole.length === 0 ? (
            <div className="text-xs text-muted-foreground mt-1">—</div>
          ) : (
            <ul className="text-xs space-y-1 mt-1">
              {headcountByRole.map((r) => {
                const label = t(`role.${r.role}.plural` as any) || r.role;
                const missing = r.total - r.planned;
                return (
                  <li key={r.role} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate">{label}</span>
                    <span className="font-mono-data">
                      <span className={missing > 0 ? "text-destructive font-semibold" : "text-foreground"}>
                        {r.planned}
                      </span>
                      <span className="text-muted-foreground">/{r.total}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}