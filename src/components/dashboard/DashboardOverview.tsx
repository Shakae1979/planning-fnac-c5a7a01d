import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, CalendarDays, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { getDisplayName, formatDateLongBE, formatDateBE, formatLocalDate, getWeekNumber } from "@/lib/format";

const ROLE_META: Record<string, { label: string; bg: string; text: string }> = {
  responsable: { label: "Resp.", bg: "bg-red-100", text: "text-red-800" },
  technique: { label: "Tech.", bg: "bg-orange-100", text: "text-orange-800" },
  editorial: { label: "Édit.", bg: "bg-yellow-100", text: "text-yellow-800" },
  stock: { label: "Stock", bg: "bg-blue-100", text: "text-blue-800" },
  caisse: { label: "Caisse", bg: "bg-emerald-100", text: "text-emerald-800" },
  stagiaire: { label: "Stage", bg: "bg-pink-100", text: "text-pink-800" },
};

const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];

const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
const SLOTS = Array.from({ length: 15 }, (_, i) => i + 7);

const CATEGORIES = [
  { key: "responsable", color: "text-orange-600 dark:text-orange-400" },
  { key: "technique", color: "text-blue-600 dark:text-blue-400" },
  { key: "editorial", color: "text-purple-600 dark:text-purple-400" },
  { key: "stock", color: "text-amber-600 dark:text-amber-400" },
  { key: "caisse", color: "text-emerald-600 dark:text-emerald-400" },
  { key: "stagiaire", color: "text-pink-600 dark:text-pink-400" },
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 7 * n);
  return d;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function isWorking(start: string | null, end: string | null, hour: number): boolean {
  if (!start || !end) return false;
  const slotStart = hour * 60;
  const slotEnd = (hour + 1) * 60;
  const workStart = timeToMinutes(start);
  const workEnd = timeToMinutes(end);
  return workStart < slotEnd && workEnd > slotStart;
}

export function DashboardOverview() {
  const { currentStore } = useStore();
  const { t } = useI18n();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatLocalDate(currentMonday);

  const DAYS = DAY_KEYS.map((key) => ({
    key,
    label: t(`day.long.${key}` as any),
  }));

  const roleLabels = (role: string) => t(`role.${role}.plural` as any) || t(`role.${role}` as any) || role;

  const { data: employees } = useQuery({
    queryKey: ["employees", currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const employeeIds = employees?.map((e) => e.id) ?? [];

  // Schedules for current week (heatmap)
  const { data: schedules } = useQuery({
    queryKey: ["schedules", weekStr, currentStore?.id],
    queryFn: async () => {
      if (employeeIds.length === 0) return [];
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", weekStr)
        .in("employee_id", employeeIds);
      if (error) throw error;
      return data;
    },
    enabled: !!employees,
  });

  const totalEmployees = employees?.length ?? 0;

  // Coverage heatmap data
  const coverage: Record<string, Record<number, { name: string; role: string }[]>> = {};
  DAYS.forEach((day) => {
    coverage[day.key] = {};
    SLOTS.forEach((hour) => {
      const working: { name: string; role: string }[] = [];
      schedules?.forEach((s) => {
        const start = (s as any)[`${day.key}_start`];
        const end = (s as any)[`${day.key}_end`];
        if (isWorking(start, end, hour)) {
          const emp = employees?.find((e) => e.id === s.employee_id);
          if (emp) working.push({ name: getDisplayName(emp), role: emp.role });
        }
      });
      coverage[day.key][hour] = working;
    });
  });

  // Employee summary
  const empSummary = employees?.map((emp) => {
    const schedule = schedules?.find((s) => s.employee_id === emp.id);
    const hoursWorked = schedule?.hours_modified ?? schedule?.hours_base ?? 0;
    const diff = Number(hoursWorked) - emp.contract_hours;
    const daysWorked = DAYS.filter((day) => {
      const start = (schedule as any)?.[`${day.key}_start`];
      const end = (schedule as any)?.[`${day.key}_end`];
      return start && end;
    }).length;
    const isRoulement = !!schedule && DAY_KEYS.every((day) => {
      const start = (schedule as any)?.[`${day}_start`];
      return !start || start === "ROULEMENT";
    });
    return { ...emp, hoursWorked: Number(hoursWorked), diff, daysWorked, hasSchedule: !!schedule, isRoulement };
  });

  const sortedEmpSummary = empSummary?.sort((a, b) => {
    const ra = ROLE_ORDER.indexOf(a.role);
    const rb = ROLE_ORDER.indexOf(b.role);
    const orderA = ra === -1 ? ROLE_ORDER.length : ra;
    const orderB = rb === -1 ? ROLE_ORDER.length : rb;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, "fr");
  });

  const totalContractHours = employees?.reduce((sum, e) => sum + e.contract_hours, 0) ?? 0;
  const totalPlannedHours = empSummary?.reduce((sum, e) => sum + e.hoursWorked, 0) ?? 0;
  const unplannedEmployees = empSummary?.filter((e) => !e.hasSchedule).length ?? 0;

  const getHeatColor = (count: number): string => {
    if (count === 0) return "bg-destructive/15 text-destructive";
    if (count === 1) return "bg-warning/20 text-warning";
    if (count <= 3) return "bg-accent/15 text-accent";
    return "bg-accent/30 text-accent font-bold";
  };

  const getMissingCategories = (dayKey: string, hour: number): string[] => {
    const workers = coverage[dayKey][hour];
    if (workers.length === 0) return [];
    const presentRoles = new Set(workers.map((w) => w.role));
    return CATEGORIES.filter((c) => !presentRoles.has(c.key)).map((c) => roleLabels(c.key));
  };

  const weekLabel = formatDateLongBE(currentMonday);

  return (
    <div className="space-y-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">S{getWeekNumber(currentMonday)} — {t("schedule.weekOfDate")} {weekLabel}</div>
            <div className="text-xs text-muted-foreground">{formatDateBE(currentMonday)}</div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5 mr-1" /> {t("action.print")}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">{t("overview.activeEmployees")}</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-bold font-mono-data">{totalEmployees}</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("recap.contractHours")}</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-bold font-mono-data">{totalContractHours}h</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("recap.plannedHours")}</span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-bold font-mono-data">{totalPlannedHours}h</span>
          {totalPlannedHours !== totalContractHours && (
            <span className={`text-xs ml-2 ${totalPlannedHours > totalContractHours ? "text-warning" : "text-destructive"}`}>
              {totalPlannedHours > totalContractHours ? "+" : ""}{totalPlannedHours - totalContractHours}h
            </span>
          )}
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("recap.unplanned")}</span>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className={`text-2xl font-bold font-mono-data ${unplannedEmployees > 0 ? "text-destructive" : ""}`}>
            {unplannedEmployees}
          </span>
        </div>
      </div>

      {/* Coverage heatmap */}
      <div className="kpi-card overflow-hidden">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">{t("recap.coverage")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="pb-2 pr-2 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[90px]">{t("conges.dayLabel")}</th>
                {SLOTS.map((h) => (
                  <th key={h} className="pb-2 text-center font-semibold text-muted-foreground min-w-[40px]">
                    {String(h).padStart(2, "0")}h00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day.key} className="border-b border-border/30">
                  <td className="py-1.5 pr-2 font-medium sticky left-0 bg-card z-10">{day.label}</td>
                  {SLOTS.map((hour) => {
                    const workers = coverage[day.key][hour];
                    const count = workers.length;
                    const missing = getMissingCategories(day.key, hour);
                    const tooltip = count > 0
                      ? workers.map((w) => `${w.name} (${roleLabels(w.role)})`).join("\n") +
                        (missing.length > 0 ? `\n⚠ ${t("recap.missing")}: ${missing.join(", ")}` : "")
                      : t("recap.nobody");
                    return (
                      <td key={hour} className="py-1.5 px-0.5 text-center">
                        <div
                          className={`rounded px-1 py-1 cursor-default ${getHeatColor(count)} ${missing.length > 0 && count > 0 ? "ring-1 ring-warning/50" : ""}`}
                          title={tooltip}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-destructive/15" /> {t("recap.0seller")}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-warning/20" /> {t("recap.1seller")}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-accent/15" /> {t("recap.2_3sellers")}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-accent/30" /> {t("recap.4sellers")}</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded ring-1 ring-warning/50" /> {t("recap.missingCategory")}</span>
        </div>
      </div>

      {/* Category coverage */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">{t("recap.categoryCoverage")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold text-muted-foreground">{t("recap.category")}</th>
                {DAYS.map((day) => (
                  <th key={day.key} className="pb-2 text-center font-semibold text-muted-foreground">{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr key={cat.key} className="border-b border-border/30">
                  <td className={`py-2 font-medium ${cat.color}`}>{roleLabels(cat.key)}</td>
                  {DAYS.map((day) => {
                    const empNames = new Set<string>();
                    SLOTS.forEach((hour) => {
                      coverage[day.key][hour]
                        .filter((w) => w.role === cat.key)
                        .forEach((w) => empNames.add(w.name));
                    });
                    const count = empNames.size;
                    return (
                      <td key={day.key} className="py-2 text-center">
                        {count === 0 ? (
                          <span className="inline-flex items-center gap-1 text-destructive font-medium">
                            <AlertTriangle className="h-3 w-3" /> 0
                          </span>
                        ) : (
                          <span className="font-mono-data font-medium">{count}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-employee summary */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">{t("recap.perSeller")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold text-muted-foreground">{t("schedule.seller")}</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">{t("recap.category")}</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">{t("recap.contract")}</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">{t("recap.planned")}</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">{t("recap.diff")}</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">{t("recap.days")}</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">{t("recap.status")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmpSummary?.map((emp) => {
                const catColor = CATEGORIES.find((c) => c.key === emp.role)?.color ?? "text-muted-foreground";
                return (
                  <tr key={emp.id} className="border-b border-border/30 table-row-hover">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                          {getDisplayName(emp).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{getDisplayName(emp)}</span>
                      </div>
                    </td>
                    <td className={`py-2 text-center text-xs font-medium ${catColor}`}>
                      {roleLabels(emp.role)}
                    </td>
                    <td className="py-2 text-center font-mono-data">{emp.contract_hours}h</td>
                    <td className="py-2 text-center font-mono-data">{emp.hasSchedule ? `${emp.hoursWorked}h` : "—"}</td>
                    <td className="py-2 text-center">
                      {emp.hasSchedule ? (
                        <span className={`font-mono-data font-medium ${emp.diff === 0 ? "text-accent" : emp.diff > 0 ? "text-warning" : "text-destructive"}`}>
                          {emp.diff === 0 ? "OK" : `${emp.diff > 0 ? "+" : ""}${emp.diff}h`}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 text-center font-mono-data">{emp.hasSchedule ? `${emp.daysWorked}j` : "—"}</td>
                    <td className="py-2 text-center">
                      {emp.isRoulement ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">{t("schedule.rotation")}</span>
                      ) : emp.hasSchedule ? (
                        <span className="badge-positive">{t("recap.statusPlanned")}</span>
                      ) : (
                        <span className="badge-negative">{t("recap.statusUnplanned")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
