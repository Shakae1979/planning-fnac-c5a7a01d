import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Printer, Download, Flag, Save, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useStoreEmployees } from "@/hooks/useStoreEmployees";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { WeekNavigator } from "@/components/WeekNavigator";
import { ROLE_ORDER } from "@/lib/role-colors";
import { computeNetHours } from "@/lib/hours";
import { formatLocalDate, getDisplayName, getMondayOf, formatDateBE } from "@/lib/format";

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
  const queryClient = useQueryClient();
  const [ferieOpen, setFerieOpen] = useState(true);
  const [ferieDrafts, setFerieDrafts] = useState<Record<string, string>>({});

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

  const { data: ferieCreditsData } = useQuery({
    queryKey: ["hours-ferie-credits", employeeIds, range.start, range.end],
    enabled: employeeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferie_credits")
        .select("*")
        .in("employee_id", employeeIds)
        .gte("date", range.start)
        .lte("date", range.end);
      if (error) throw error;
      return data;
    },
  });

  const ferieCreditsByEmp = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    (ferieCreditsData || []).forEach((row: any) => {
      if (!map.has(row.employee_id)) map.set(row.employee_id, new Map());
      map.get(row.employee_id)!.set(row.date, Number(row.hours) || 0);
    });
    return map;
  }, [ferieCreditsData]);

  type Row = {
    id: string;
    name: string;
    role: string;
    contract: number;
    weekWorked: number;
    weekCredited: number;
    monthWorked: number;
    monthCredited: number;
    monthContract: number;
    missing: string[]; // dates manquantes (semaine + mois cumulés, dédupliqués)
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
      const contract = Number(emp.contract_hours) || 0;
      const fMap = ferieCreditsByEmp.get(emp.id) || null;
      const missingSet = new Set<string>();

      // Week
      const wSchedule = schedulesByKey.get(`${emp.id}|${weekStr}`) || {};
      const wDayComments = commentsByWeek.get(weekStr) || [];
      const w = computeNetHours(wSchedule, empConges, wDayComments, currentMonday, tpl, contract, fMap);
      w.missingFerieCredits.forEach((d) => missingSet.add(d));

      // Month = sum over month Mondays
      let monthWorked = 0;
      let monthCredited = 0;
      for (const m of monthMondays) {
        const ms = formatLocalDate(m);
        const sch = schedulesByKey.get(`${emp.id}|${ms}`) || {};
        const dc = commentsByWeek.get(ms) || [];
        const r = computeNetHours(sch, empConges, dc, m, tpl, contract, fMap);
        monthWorked += r.worked;
        monthCredited += r.credited;
        r.missingFerieCredits.forEach((d) => missingSet.add(d));
      }

      const monthContract = contract * monthMondays.length;
      return {
        id: emp.id,
        name: getDisplayName(emp),
        role: emp.role,
        contract,
        weekWorked: w.worked,
        weekCredited: w.credited,
        monthWorked,
        monthCredited,
        monthContract,
        missing: Array.from(missingSet).sort(),
      };
    });
  }, [employees, schedules, templates, allConges, dayComments, ferieCreditsByEmp, currentMonday, monthMondays]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        contract: acc.contract + r.contract,
        weekWorked: acc.weekWorked + r.weekWorked,
        weekCredited: acc.weekCredited + r.weekCredited,
        monthWorked: acc.monthWorked + r.monthWorked,
        monthCredited: acc.monthCredited + r.monthCredited,
        monthContract: acc.monthContract + r.monthContract,
      }),
      { contract: 0, weekWorked: 0, weekCredited: 0, monthWorked: 0, monthCredited: 0, monthContract: 0 }
    );
  }, [rows]);

  // Liste plate des fériés à saisir (toutes lignes confondues, déduplication employee|date)
  const missingFerieList = useMemo(() => {
    const out: { emp: Row; date: string }[] = [];
    rows.forEach((r) => r.missing.forEach((d) => out.push({ emp: r, date: d })));
    out.sort((a, b) => a.date.localeCompare(b.date) || a.emp.name.localeCompare(b.emp.name));
    return out;
  }, [rows]);

  const saveFerie = useMutation({
    mutationFn: async ({ employeeId, date, hours }: { employeeId: string; date: string; hours: number }) => {
      const { error } = await supabase
        .from("ferie_credits")
        .upsert({ employee_id: employeeId, date, hours }, { onConflict: "employee_id,date" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      setFerieDrafts((prev) => { const n = { ...prev }; delete n[`${vars.employeeId}|${vars.date}`]; return n; });
      queryClient.invalidateQueries({ queryKey: ["hours-ferie-credits"] });
      toast({ title: t("hours.ferieCreditSaved") });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const exportCsv = () => {
    const headers = [
      t("hours.employee"),
      t("hours.role"),
      t("hours.contract"),
      t("hours.weekWorked"),
      t("hours.weekCredited"),
      t("hours.weekTotal"),
      t("hours.weekGap"),
      t("hours.monthWorked"),
      t("hours.monthCredited"),
      t("hours.monthTotal"),
      t("hours.monthContract"),
      t("hours.monthGap"),
    ];
    const lines = [headers.join(";")];
    for (const r of rows) {
      const wTot = r.weekWorked + r.weekCredited;
      const mTot = r.monthWorked + r.monthCredited;
      lines.push([
        r.name,
        r.role,
        r.contract.toFixed(1),
        r.weekWorked.toFixed(1),
        r.weekCredited.toFixed(1),
        wTot.toFixed(1),
        (wTot - r.contract).toFixed(1),
        r.monthWorked.toFixed(1),
        r.monthCredited.toFixed(1),
        mTot.toFixed(1),
        r.monthContract.toFixed(1),
        (mTot - r.monthContract).toFixed(1),
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

      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {t("hours.creditRule")}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">{t("hours.employee")}</th>
              <th className="text-left px-3 py-2 font-semibold">{t("hours.role")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.contract")}</th>
              <th className="text-right px-3 py-2 font-semibold border-l">{t("hours.weekWorked")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.weekCredited")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.weekTotal")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.weekGap")}</th>
              <th className="text-right px-3 py-2 font-semibold border-l">{t("hours.monthWorked")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.monthCredited")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.monthTotal")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.monthContract")}</th>
              <th className="text-right px-3 py-2 font-semibold">{t("hours.monthGap")}</th>
            </tr>
          </thead>
          <tbody>
            {empLoading && (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">…</td></tr>
            )}
            {!empLoading && rows.length === 0 && (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">—</td></tr>
            )}
            {rows.map((r) => {
              const wTot = r.weekWorked + r.weekCredited;
              const mTot = r.monthWorked + r.monthCredited;
              // Écart = heures réellement prestées − contrat (les crédits d'absence ne comblent PAS l'écart)
              const weekGap = r.weekWorked - r.contract;
              const monthGap = r.monthWorked - r.monthContract;
              return (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-1.5 font-medium">{r.name}</td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground capitalize">{r.role}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{r.contract.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono border-l">{r.weekWorked.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono text-blue-700">{r.weekCredited > 0 ? `+${r.weekCredited.toFixed(1)}h` : "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono font-semibold">{wTot.toFixed(1)}h</td>
                  <td className={`px-3 py-1.5 text-right font-mono font-semibold ${gapClass(weekGap)}`}>{weekGap >= 0 ? "+" : ""}{weekGap.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono border-l">{r.monthWorked.toFixed(1)}h</td>
                  <td className="px-3 py-1.5 text-right font-mono text-blue-700">{r.monthCredited > 0 ? `+${r.monthCredited.toFixed(1)}h` : "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono font-semibold">{mTot.toFixed(1)}h</td>
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
                <td className="px-3 py-2 text-right font-mono text-blue-700">+{totals.weekCredited.toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono">{(totals.weekWorked + totals.weekCredited).toFixed(1)}h</td>
                <td className={`px-3 py-2 text-right font-mono ${gapClass(totals.weekWorked - totals.contract)}`}>{((totals.weekWorked - totals.contract) >= 0 ? "+" : "")}{(totals.weekWorked - totals.contract).toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono border-l">{totals.monthWorked.toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono text-blue-700">+{totals.monthCredited.toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono">{(totals.monthWorked + totals.monthCredited).toFixed(1)}h</td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">{totals.monthContract.toFixed(1)}h</td>
                <td className={`px-3 py-2 text-right font-mono ${gapClass(totals.monthWorked - totals.monthContract)}`}>{((totals.monthWorked - totals.monthContract) >= 0 ? "+" : "")}{(totals.monthWorked - totals.monthContract).toFixed(1)}h</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {missingFerieList.length > 0 && (
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800">
          <button
            onClick={() => setFerieOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-amber-900 dark:text-amber-100"
          >
            <span className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              {t("hours.ferieToFill")} ({missingFerieList.length})
            </span>
            {ferieOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {ferieOpen && (
            <div className="px-3 pb-3 space-y-1.5">
              <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mb-2">{t("hours.ferieToFillDesc")}</p>
              {missingFerieList.map(({ emp, date }) => {
                const key = `${emp.id}|${date}`;
                const draft = ferieDrafts[key] ?? "";
                const suggestion = emp.contract > 0 ? (emp.contract / 5).toFixed(1) : "0";
                return (
                  <div key={key} className="flex items-center gap-2 bg-background rounded-md border px-2 py-1.5">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{emp.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{formatDateBE(new Date(date + "T00:00:00"))}</span>
                    </div>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      max="24"
                      placeholder={suggestion}
                      value={draft}
                      onChange={(e) => setFerieDrafts((p) => ({ ...p, [key]: e.target.value }))}
                      className="h-8 w-20 text-right font-mono"
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8"
                      disabled={saveFerie.isPending}
                      onClick={() => {
                        const v = parseFloat(draft || suggestion);
                        if (!isFinite(v) || v < 0) {
                          toast({ title: t("hours.invalidHours"), variant: "destructive" });
                          return;
                        }
                        saveFerie.mutate({ employeeId: emp.id, date, hours: v });
                      }}
                    >
                      <Save className="h-3.5 w-3.5" /> {t("hours.save")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}