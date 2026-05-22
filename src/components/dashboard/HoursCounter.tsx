import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useStoreEmployees } from "@/hooks/useStoreEmployees";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { WeekNavigator } from "@/components/WeekNavigator";
import { ROLE_ORDER } from "@/lib/role-colors";
import { computeNetHours } from "@/lib/hours";
import { formatLocalDate, getDisplayName, getMondayOf } from "@/lib/format";
import { EmployeeHoursDetailDialog } from "./EmployeeHoursDetailDialog";

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addWeeks(d: Date, n: number) { return addDays(d, n * 7); }

function getMonthWeekMondays(anyMonday: Date): Date[] {
  const month = anyMonday.getMonth();
  const year = anyMonday.getFullYear();
  const firstOfMonth = new Date(year, month, 1);
  let cursor = getMondayOf(firstOfMonth);
  if (cursor.getMonth() !== month) cursor = addWeeks(cursor, 1);
  const result: Date[] = [];
  while (cursor.getMonth() === month && cursor.getFullYear() === year) {
    result.push(new Date(cursor));
    cursor = addWeeks(cursor, 1);
  }
  return result;
}

function gapClass(gap: number): string {
  const abs = Math.abs(gap);
  if (abs <= 1) return "text-emerald-600";
  if (abs <= 4) return "text-amber-600";
  return "text-red-600";
}

export function HoursCounter() {
  const { t, lang } = useI18n();
  const { currentStore } = useStore();
  const { employees, isLoading: empLoading } = useStoreEmployees(ROLE_ORDER as unknown as string[]);
  const [detailEmp, setDetailEmp] = useState<any | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);
  const todayMonday = useMemo(() => getMondayOf(new Date()), []);
  const currentMonday = useMemo(() => addWeeks(todayMonday, weekOffset), [todayMonday, weekOffset]);
  const monthMondays = useMemo(() => getMonthWeekMondays(currentMonday), [currentMonday]);

  const monthLabel = currentMonday.toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE", { month: "long", year: "numeric" });

  const employeeIds = useMemo(() => (employees || []).map((e) => e.id), [employees]);
  const weekStarts = useMemo(() => {
    const set = new Set<string>();
    set.add(formatLocalDate(currentMonday));
    monthMondays.forEach((m) => set.add(formatLocalDate(m)));
    return Array.from(set);
  }, [currentMonday, monthMondays]);

  const { data: schedules } = useQuery({
    queryKey: ["hours-schedules", employeeIds, weekStarts],
    enabled: employeeIds.length > 0 && weekStarts.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .in("employee_id", employeeIds)
        .in("week_start", weekStarts);
      if (error) throw error;
      return data;
    },
  });

  type Row = {
    id: string;
    name: string;
    role: string;
    contract: number;
    weekWorked: number;
    monthWorked: number;
    monthContract: number;
  };

  const rows: Row[] = useMemo(() => {
    if (!employees) return [];
    const schedulesByKey = new Map<string, any>();
    (schedules || []).forEach((s: any) => schedulesByKey.set(`${s.employee_id}|${s.week_start}`, s));
    const weekStr = formatLocalDate(currentMonday);

    return employees.map((emp) => {
      const contract = Number(emp.contract_hours) || 0;
      const wSchedule = schedulesByKey.get(`${emp.id}|${weekStr}`) || {};
      const w = computeNetHours(wSchedule);

      let monthWorked = 0;
      for (const m of monthMondays) {
        const ms = formatLocalDate(m);
        const sch = schedulesByKey.get(`${emp.id}|${ms}`) || {};
        const r = computeNetHours(sch);
        monthWorked += r.worked;
      }

      const monthContract = contract * monthMondays.length;
      return {
        id: emp.id,
        name: getDisplayName(emp),
        role: emp.role,
        contract,
        weekWorked: w.worked,
        monthWorked,
        monthContract,
      };
    });
  }, [employees, schedules, currentMonday, monthMondays]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        contract: acc.contract + r.contract,
        weekWorked: acc.weekWorked + r.weekWorked,
        monthWorked: acc.monthWorked + r.monthWorked,
        monthContract: acc.monthContract + r.monthContract,
      }),
      { contract: 0, weekWorked: 0, monthWorked: 0, monthContract: 0 }
    );
  }, [rows]);

  const exportCsv = () => {
    const headers = [
      t("hours.employee"),
      t("hours.role"),
      t("hours.contract"),
      t("hours.weekWorked"),
      t("hours.weekGap"),
      t("hours.monthWorked"),
      t("hours.monthContract"),
      t("hours.monthGap"),
    ];
    const lines = [headers.join(";")];
    for (const r of rows) {
      lines.push([
        r.name,
        r.role,
        r.contract.toFixed(1),
        r.weekWorked.toFixed(1),
        (r.weekWorked - r.contract).toFixed(1),
        r.monthWorked.toFixed(1),
        r.monthContract.toFixed(1),
        (r.monthWorked - r.monthContract).toFixed(1),
      ].join(";"));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compteur-heures-${formatLocalDate(currentMonday)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <div>
            <h2 className="text-xl font-bold">{t("hours.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("hours.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> {t("hours.export")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <WeekNavigator offset={weekOffset} onChange={setWeekOffset} />
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold capitalize">{monthLabel}</span> · {monthMondays.length} {monthMondays.length > 1 ? "semaines" : "semaine"}
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">{t("hours.employee")}</th>
              <th className="text-left px-3 py-2 font-semibold">{t("hours.role")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.contract")}</th>
              <th className="text-right px-3 py-2 font-semibold border-l">{t("hours.weekWorked")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.weekGap")}</th>
              <th className="text-right px-3 py-2 font-semibold border-l">{t("hours.monthWorked")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.monthContract")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.monthGap")}</th>
            </tr>
          </thead>
          <tbody>
            {empLoading && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">…</td></tr>
            )}
            {!empLoading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">—</td></tr>
            )}
            {rows.map((r) => {
              const weekGap = r.weekWorked - r.contract;
              const monthGap = r.monthWorked - r.monthContract;
              return (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-1.5 font-medium">
                    <button
                      type="button"
                      onClick={() => setDetailEmp((employees || []).find((e) => e.id === r.id) || null)}
                      className="text-left hover:text-accent hover:underline underline-offset-2 transition-colors"
                    >
                      {r.name}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground capitalize">{r.role}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{r.contract.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono border-l">{r.weekWorked.toFixed(1)}h</td>
                  <td className={`px-3 py-1.5 text-right font-mono font-semibold ${gapClass(weekGap)}`}>{weekGap >= 0 ? "+" : ""}{weekGap.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono border-l">{r.monthWorked.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{r.monthContract.toFixed(1)}h</td>
                  <td className={`px-3 py-1.5 text-right font-mono font-semibold ${gapClass(monthGap)}`}>{monthGap >= 0 ? "+" : ""}{monthGap.toFixed(1)}h</td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-muted/30 font-semibold">
              <tr className="border-t-2">
                <td className="px-3 py-2" colSpan={2}>{t("hours.total")}</td>
                <td className="px-3 py-2 text-right font-mono">{totals.contract.toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono border-l">{totals.weekWorked.toFixed(1)}h</td>
                <td className={`px-3 py-2 text-right font-mono ${gapClass(totals.weekWorked - totals.contract)}`}>{((totals.weekWorked - totals.contract) >= 0 ? "+" : "")}{(totals.weekWorked - totals.contract).toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono border-l">{totals.monthWorked.toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">{totals.monthContract.toFixed(1)}h</td>
                <td className={`px-3 py-2 text-right font-mono ${gapClass(totals.monthWorked - totals.monthContract)}`}>{((totals.monthWorked - totals.monthContract) >= 0 ? "+" : "")}{(totals.monthWorked - totals.monthContract).toFixed(1)}h</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <EmployeeHoursDetailDialog
        employee={detailEmp}
        weekMonday={currentMonday}
        monthMondays={monthMondays}
        storeId={currentStore?.id}
        onClose={() => setDetailEmp(null)}
      />
    </div>
  );
}