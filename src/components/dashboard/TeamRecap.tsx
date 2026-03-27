import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Users, AlertTriangle, CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateLongBE, formatDateBE, formatLocalDate, getWeekNumber } from "@/lib/format";
import { useStore } from "@/hooks/useStore";

const DAYS = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
] as const;

const SLOTS = Array.from({ length: 15 }, (_, i) => i + 7);

const CATEGORIES = [
  { key: "responsable", label: "Responsables", color: "text-orange-600 dark:text-orange-400" },
  { key: "technique", label: "Technique", color: "text-blue-600 dark:text-blue-400" },
  { key: "editorial", label: "Éditorial", color: "text-purple-600 dark:text-purple-400" },
  { key: "stock", label: "Stock", color: "text-amber-600 dark:text-amber-400" },
  { key: "caisse", label: "Caisse", color: "text-emerald-600 dark:text-emerald-400" },
  { key: "stagiaire", label: "Stagiaires", color: "text-pink-600 dark:text-pink-400" },
];

const ROLE_LABELS: Record<string, string> = {
  responsable: "Responsables",
  technique: "Technique",
  editorial: "Éditorial",
  stock: "Stock",
  caisse: "Caisse",
  stagiaire: "Stagiaires",
};

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

function formatWeekDate(date: Date): string {
  return formatLocalDate(date);
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

export function TeamRecap() {
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatWeekDate(currentMonday);

  const { currentStore } = useStore();
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

  const { data: schedules } = useQuery({
    queryKey: ["schedules", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const weekLabel = formatDateLongBE(currentMonday);

  // Build coverage data: for each day/hour, which employees are working (with their role)
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
          if (emp) working.push({ name: emp.name, role: emp.role });
        }
      });
      coverage[day.key][hour] = working;
    });
  });

  // Summary per employee
  const empSummary = employees?.map((emp) => {
    const schedule = schedules?.find((s) => s.employee_id === emp.id);
    const hoursWorked = schedule?.hours_modified ?? schedule?.hours_base ?? 0;
    const diff = Number(hoursWorked) - emp.contract_hours;
    const daysWorked = DAYS.filter((day) => {
      const start = (schedule as any)?.[`${day.key}_start`];
      const end = (schedule as any)?.[`${day.key}_end`];
      return start && end;
    }).length;
    return { ...emp, hoursWorked: Number(hoursWorked), diff, daysWorked, hasSchedule: !!schedule };
  });

  // Group employees by category for summary
  const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];
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

  // Check if a category is missing for a given day/hour
  const getMissingCategories = (dayKey: string, hour: number): string[] => {
    const workers = coverage[dayKey][hour];
    if (workers.length === 0) return [];
    const presentRoles = new Set(workers.map((w) => w.role));
    return CATEGORIES.filter((c) => !presentRoles.has(c.key)).map((c) => c.label);
  };

  return (
    <div className="space-y-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">S{getWeekNumber(currentMonday)} — Semaine du {weekLabel}</div>
            <div className="text-xs text-muted-foreground">{formatDateBE(currentMonday)}</div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
        </Button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Heures contrat</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-bold font-mono-data">{totalContractHours}h</span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Heures planifiées</span>
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
            <span className="text-sm text-muted-foreground">Non planifiés</span>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className={`text-2xl font-bold font-mono-data ${unplannedEmployees > 0 ? "text-destructive" : ""}`}>
            {unplannedEmployees}
          </span>
        </div>
      </div>

      {/* Coverage heatmap with category breakdown */}
      <div className="kpi-card overflow-hidden">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Couverture horaire — Nombre de vendeurs par créneau</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="pb-2 pr-2 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[90px]">Jour</th>
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
                      ? workers.map((w) => `${w.name} (${ROLE_LABELS[w.role] ?? w.role})`).join("\n") +
                        (missing.length > 0 ? `\n⚠ Manque: ${missing.join(", ")}` : "")
                      : "Personne";
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
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-destructive/15" /> 0 vendeur</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-warning/20" /> 1 vendeur</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-accent/15" /> 2-3 vendeurs</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-accent/30" /> 4+ vendeurs</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded ring-1 ring-warning/50" /> Catégorie manquante</span>
        </div>
      </div>

      {/* Category coverage per day */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Couverture par catégorie — Présence par jour</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold text-muted-foreground">Catégorie</th>
                {DAYS.map((day) => (
                  <th key={day.key} className="pb-2 text-center font-semibold text-muted-foreground">{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr key={cat.key} className="border-b border-border/30">
                  <td className={`py-2 font-medium ${cat.color}`}>{cat.label}</td>
                  {DAYS.map((day) => {
                    // Count unique employees of this category working any slot this day
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

      {/* Per-employee summary grouped by category */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Récapitulatif par vendeur</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold text-muted-foreground">Vendeur</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Catégorie</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Contrat</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Planifié</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Écart</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Jours</th>
                <th className="pb-2 text-center font-semibold text-muted-foreground">Statut</th>
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
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className={`py-2 text-center text-xs font-medium ${catColor}`}>
                      {ROLE_LABELS[emp.role] ?? emp.role}
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
                      {emp.hasSchedule ? (
                        <span className="badge-positive">Planifié</span>
                      ) : (
                        <span className="badge-negative">Non planifié</span>
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
