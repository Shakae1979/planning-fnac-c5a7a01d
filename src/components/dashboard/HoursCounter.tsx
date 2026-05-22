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

const TEMPLATE_WEEK = "1970-01-05";

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addWeeks(d: Date, n: number) { return addDays(d, n * 7); }

/** All ISO week-Mondays whose Monday falls inside the calendar month of `anyMonday`. */
function getMonthWeekMondays(anyMonday: Date): Date[] {
  const month = anyMonday.getMonth();
  const year = anyMonday.getFullYear();
  // Start from first day of month, walk to its Monday (could be in previous month)
  const firstOfMonth = new Date(year, month, 1);
  let cursor = getMondayOf(firstOfMonth);
  // If that Monday is before the month, skip a week to land in the month
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

  const [weekOffset, setWeekOffset] = useState(0);
  const todayMonday = useMemo(() => getMondayOf(new Date()), []);
  const currentMonday = useMemo(() => addWeeks(todayMonday, weekOffset), [todayMonday, weekOffset]);
  const monthMondays = useMemo(() => getMonthWeekMondays(currentMonday), [currentMonday]);

  const monthLabel = currentMonday.toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE", { month: "long", year: "numeric" });

  const employeeIds = useMemo(() => (employees || []).map((e) => e.id), [employees]);
  // Union of relevant week_starts (week shown + month weeks)
  const weekStarts = useMemo(() => {
    const set = new Set<string>();
    set.add(formatLocalDate(currentMonday));
    monthMondays.forEach((m) => set.add(formatLocalDate(m)));
    return Array.from(set);
  }, [currentMonday, monthMondays]);

  // Date range covering union (min..max+6d) for conges & day_comments filtering
  const range = useMemo(() => {
    if (weekStarts.length === 0) return { start: formatLocalDate(currentMonday), end: formatLocalDate(addDays(currentMonday, 6)) };
    const sorted = [...weekStarts].sort();
    const startStr = sorted[0];
    const endDate = addDays(new Date(sorted[sorted.length - 1] + "T00:00:00"), 6);
    return { start: startStr, end: formatLocalDate(endDate) };
  }, [weekStarts, currentMonday]);

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

  const { data: templates } = useQuery({
    queryKey: ["hours-templates", employeeIds],
    enabled: employeeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .in("employee_id", employeeIds)
        .eq("week_start", TEMPLATE_WEEK);
      if (error) throw error;
      return data;
    },
  });

  const { data: allConges } = useQuery({
    queryKey: ["hours-conges", employeeIds, range.start, range.end],
    enabled: employeeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .in("employee_id", employeeIds)
        .lte("date_start", range.end)
        .gte("date_end", range.start);
      if (error) throw error;
      return data;
    },
  });

  const { data: dayComments } = useQuery({
    queryKey: ["hours-day-comments", currentStore?.id, weekStarts],
    enabled: !!currentStore && weekStarts.length > 0,
    queryFn: async () => {
      let q = supabase.from("day_comments").select("*").in("week_start", weekStarts);
      if (currentStore) q = q.eq("store_id", currentStore.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  type Row = {
    id: string;
    name: string;
    role: string;
    contract: number;
    weekNet: number;
    monthNet: number;
    monthContract: number;
  };

  const rows: Row[] = useMemo(() => {
    if (!employees) return [];
    const schedulesByKey = new Map<string, any>();
    (schedules || []).forEach((s: any) => schedulesByKey.set(`${s.employee_id}|${s.week_start}`, s));
    const templateByEmp = new Map<string, any>();
    (templates || []).forEach((s: any) => templateByEmp.set(s.employee_id, s));
    const congesByEmp = new Map<string, any[]>();
    (allConges || []).forEach((c: any) => {
      const arr = congesByEmp.get(c.employee_id) || [];
      arr.push(c);
      congesByEmp.set(c.employee_id, arr);
    });
    const commentsByWeek = new Map<string, any[]>();
    (dayComments || []).forEach((dc: any) => {
      const arr = commentsByWeek.get(dc.week_start) || [];
      arr.push(dc);
      commentsByWeek.set(dc.week_start, arr);
    });
    const weekStr = formatLocalDate(currentMonday);

    return employees.map((emp) => {
      const tpl = templateByEmp.get(emp.id) || null;
      const empConges = congesByEmp.get(emp.id) || [];

      // Week net
      const wSchedule = schedulesByKey.get(`${emp.id}|${weekStr}`) || {};
      const wDayComments = commentsByWeek.get(weekStr) || [];
      const { net: weekNet } = computeNetHours(wSchedule, empConges, wDayComments, currentMonday, tpl);

      // Month net = sum over month Mondays
      let monthNet = 0;
      for (const m of monthMondays) {
        const ms = formatLocalDate(m);
        const sch = schedulesByKey.get(`${emp.id}|${ms}`) || {};
        const dc = commentsByWeek.get(ms) || [];
        const { net } = computeNetHours(sch, empConges, dc, m, tpl);
        monthNet += net;
      }

      const contract = Number(emp.contract_hours) || 0;
      const monthContract = contract * monthMondays.length;
      return {
        id: emp.id,
        name: getDisplayName(emp),
        role: emp.role,
        contract,
        weekNet,
        monthNet,
        monthContract,
      };
    });
  }, [employees, schedules, templates, allConges, dayComments, currentMonday, monthMondays]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        contract: acc.contract + r.contract,
        weekNet: acc.weekNet + r.weekNet,
        monthNet: acc.monthNet + r.monthNet,
        monthContract: acc.monthContract + r.monthContract,
      }),
      { contract: 0, weekNet: 0, monthNet: 0, monthContract: 0 }
    );
  }, [rows]);

  const exportCsv = () => {
    const headers = [
      t("hours.employee"),
      t("hours.role"),
      t("hours.contract"),
      t("hours.weekPlanned"),
      t("hours.weekGap"),
      t("hours.monthPlanned"),
      t("hours.monthContract"),
      t("hours.monthGap"),
    ];
    const lines = [headers.join(";")];
    for (const r of rows) {
      lines.push([
        r.name,
        r.role,
        r.contract.toFixed(1),
        r.weekNet.toFixed(1),
        (r.weekNet - r.contract).toFixed(1),
        r.monthNet.toFixed(1),
        r.monthContract.toFixed(1),
        (r.monthNet - r.monthContract).toFixed(1),
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
              <th className="text-right px-3 py-2 font-semibold border-l">{t("hours.weekPlanned")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.weekGap")}</th>
              <th className="text-right px-3 py-2 font-semibold border-l">{t("hours.monthPlanned")}</th>
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
              const weekGap = r.weekNet - r.contract;
              const monthGap = r.monthNet - r.monthContract;
              return (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-1.5 font-medium">{r.name}</td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground capitalize">{r.role}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{r.contract.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono border-l">{r.weekNet.toFixed(1)}h</td>
                  <td className={`px-3 py-1.5 text-right font-mono font-semibold ${gapClass(weekGap)}`}>{weekGap >= 0 ? "+" : ""}{weekGap.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono border-l">{r.monthNet.toFixed(1)}h</td>
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
                <td className="px-3 py-2 text-right font-mono border-l">{totals.weekNet.toFixed(1)}h</td>
                <td className={`px-3 py-2 text-right font-mono ${gapClass(totals.weekNet - totals.contract)}`}>{(totals.weekNet - totals.contract >= 0 ? "+" : "")}{(totals.weekNet - totals.contract).toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono border-l">{totals.monthNet.toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">{totals.monthContract.toFixed(1)}h</td>
                <td className={`px-3 py-2 text-right font-mono ${gapClass(totals.monthNet - totals.monthContract)}`}>{(totals.monthNet - totals.monthContract >= 0 ? "+" : "")}{(totals.monthNet - totals.monthContract).toFixed(1)}h</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}