import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { ChevronLeft, ChevronRight, Crown, Palmtree, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLocalDate, getWeekNumber, formatTimeBE } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

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

function getDayDate(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIndex);
  return formatLocalDate(d);
}

const LEAVE_COLORS: Record<string, string> = {
  conge: "bg-lime-500/20 text-lime-700 dark:text-lime-400",
  rtt: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  maladie: "bg-rose-500/20 text-rose-700 dark:text-rose-400",
  formation: "bg-violet-500/20 text-violet-700 dark:text-violet-400",
  autre: "bg-orange-400/20 text-orange-700 dark:text-orange-400",
};

export function DirectionFnac() {
  const { t, formatDateLong } = useI18n();
  const { currentStore } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatLocalDate(currentMonday);

  const DAYS = DAY_KEYS.map((key) => ({
    key,
    label: t(`day.short.${key}` as any),
  }));

  // Fetch all users with store assignments (via manage-users edge function)
  const { data: allUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["direction-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data || []) as {
        id: string;
        email: string;
        role: string;
        stores: { store_id: string; store_name: string; is_manager: boolean }[];
      }[];
    },
  });

  // Fetch all active employees
  const { data: allEmployees } = useQuery({
    queryKey: ["direction-employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Get store managers (is_manager = true) and match to employees
  const managerEmployees = useMemo(() => {
    const storeManagers = (allUsers || []).filter((u) =>
      u.stores?.some((s) => s.is_manager)
    );
    return storeManagers.map((mgr) => {
      const emp = (allEmployees || []).find(
        (e) => e.email && mgr.email && e.email.toLowerCase() === mgr.email.toLowerCase()
      );
      const managerStores = mgr.stores.filter((s) => s.is_manager);
      return {
        userId: mgr.id,
        email: mgr.email,
        employee: emp || null,
        storeNames: managerStores.map((s) => s.store_name),
      };
    });
  }, [allUsers, allEmployees]);

  const employeeIds = useMemo(
    () => managerEmployees.filter((m) => m.employee).map((m) => m.employee!.id),
    [managerEmployees]
  );

  // Stable string key for queries
  const employeeIdsKey = employeeIds.sort().join(",");

  // Fetch schedules for these employees
  const { data: schedules } = useQuery({
    queryKey: ["direction-schedules", weekStr, employeeIdsKey],
    enabled: employeeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", weekStr)
        .in("employee_id", employeeIds);
      if (error) throw error;
      return data;
    },
  });

  // Fetch congés for these employees (overlapping with the week)
  const weekEnd = new Date(currentMonday);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = formatLocalDate(weekEnd);

  const { data: conges } = useQuery({
    queryKey: ["direction-conges", weekStr, weekEndStr, employeeIdsKey],
    enabled: employeeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .in("employee_id", employeeIds)
        .lte("date_start", weekEndStr)
        .gte("date_end", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const scheduleMap = new Map<string, any>();
  (schedules || []).forEach((s) => scheduleMap.set(s.employee_id, s));

  const getCongeForDay = (empId: string, dateStr: string) => {
    return (conges || []).find(
      (c) => c.employee_id === empId && c.date_start <= dateStr && c.date_end >= dateStr
    );
  };

  const weekNumber = getWeekNumber(currentMonday);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Direction Fnac
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="no-print" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[200px]">
            <p className="text-sm font-semibold text-foreground">
              {t("schedule.week" as any)} {weekNumber}
            </p>
            <p className="text-xs text-muted-foreground">{formatDateLong(currentMonday)}</p>
          </div>
          <Button variant="outline" size="sm" className="no-print" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="no-print" onClick={() => setWeekOffset(0)}>
            {t("teamDay.today" as any)}
          </Button>
          <Button variant="outline" size="sm" className="no-print gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />{t("action.print")}
          </Button>
        </div>
      </div>

      {loadingUsers ? (
        <div className="kpi-card text-center py-8">
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      ) : managerEmployees.length === 0 ? (
        <div className="kpi-card text-center py-8">
          <Crown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("direction.noManagers" as any)}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium min-w-[180px] border-r">
                  Store Manager
                </th>
                {DAYS.map((day, i) => {
                  const dayDate = new Date(currentMonday);
                  dayDate.setDate(dayDate.getDate() + i);
                  return (
                    <th key={day.key} className="px-2 py-2 text-center font-medium min-w-[120px] border-r last:border-r-0">
                      <div className="text-xs">{day.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {String(dayDate.getDate()).padStart(2, "0")}/{String(dayDate.getMonth() + 1).padStart(2, "0")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {managerEmployees.map((mgr) => {
                const schedule = mgr.employee ? scheduleMap.get(mgr.employee.id) : null;

                return (
                  <tr key={mgr.userId} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="sticky left-0 bg-card px-3 py-2 border-r">
                      <div className="flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[130px]">
                            {mgr.employee
                              ? [mgr.employee.name, mgr.employee.last_name].filter(Boolean).join(" ")
                              : mgr.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                            {mgr.storeNames.join(", ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    {DAY_KEYS.map((dayKey, dayIndex) => {
                      const dateStr = getDayDate(currentMonday, dayIndex);
                      const conge = mgr.employee ? getCongeForDay(mgr.employee.id, dateStr) : null;

                      if (conge) {
                        const leaveType = conge.type || "conge";
                        const colorClass = LEAVE_COLORS[leaveType] || LEAVE_COLORS.conge;
                        const leaveLabel = t(`leave.${leaveType}.short` as any) || leaveType;
                        return (
                          <td key={dayKey} className="px-1 py-2 text-center border-r last:border-r-0">
                            <div className={`rounded-md px-2 py-1.5 ${colorClass}`}>
                              <div className="flex items-center justify-center gap-1">
                                <Palmtree className="h-3 w-3" />
                                <span className="text-[10px] font-semibold">{leaveLabel}</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      const start = schedule?.[`${dayKey}_start`] as string | null;
                      const end = schedule?.[`${dayKey}_end`] as string | null;

                      if (!start || !end) {
                        return (
                          <td key={dayKey} className="px-1 py-2 text-center border-r last:border-r-0">
                            <span className="text-muted-foreground/40">—</span>
                          </td>
                        );
                      }

                      // Handle special values (EXT, FERIE, Roulement, etc.)
                      const specialValues = ["FERIE", "EXT", "Roulement", "ROUL"];
                      const isSpecialStart = specialValues.some((sv) => start.toUpperCase().includes(sv.toUpperCase()));
                      const isSpecialEnd = !end || end.trim() === "" || specialValues.some((sv) => end.toUpperCase().includes(sv.toUpperCase()));

                      if (isSpecialStart || isSpecialEnd) {
                        const label = start;
                        return (
                          <td key={dayKey} className="px-1 py-2 text-center border-r last:border-r-0">
                            <div className="bg-muted/50 rounded-md px-2 py-1.5">
                              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={dayKey} className="px-1 py-2 text-center border-r last:border-r-0">
                          <div className="bg-primary/10 rounded-md px-2 py-1.5">
                            <span className="text-[11px] font-medium text-foreground">
                              {formatTimeBE(start)} – {formatTimeBE(end)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-primary/10" />
          {t("direction.working" as any)}
        </span>
        {Object.entries(LEAVE_COLORS).map(([type, colorClass]) => (
          <span key={type} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${colorClass.split(" ")[0]}`} />
            {t(`leave.${type}.short` as any) || type}
          </span>
        ))}
      </div>
    </div>
  );
}
