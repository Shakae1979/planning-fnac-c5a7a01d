import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { computeNetHours, timeToHours, getDayDate, BREAK_HOURS } from "@/lib/hours";
import { formatLocalDate, formatTimeBE, formatDateBE, getDisplayName } from "@/lib/format";
import { Clock, Palmtree, Sun, Thermometer, GraduationCap, Baby, Stethoscope, Hourglass, MoreHorizontal, HelpCircle, MapPin, RefreshCw, Flag, type LucideIcon } from "lucide-react";

const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

const CONGE_ICONS: Record<string, LucideIcon> = {
  conge: Palmtree, rtt: Sun, maladie: Thermometer, formation: GraduationCap,
  parental: Baby, medical: Stethoscope, fincarriere: Hourglass,
  divers: MoreHorizontal, autre: HelpCircle,
};

const CONGE_COLORS: Record<string, string> = {
  conge: "bg-blue-500", rtt: "bg-emerald-500", maladie: "bg-red-600",
  formation: "bg-violet-500", parental: "bg-fuchsia-500", medical: "bg-yellow-500",
  fincarriere: "bg-teal-500", divers: "bg-amber-500", autre: "bg-slate-500",
};

interface Props {
  employee: any | null;
  weekMonday: Date;
  monthMondays: Date[];
  storeId: string | undefined;
  onClose: () => void;
}

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export function EmployeeHoursDetailDialog({ employee, weekMonday, monthMondays, storeId, onClose }: Props) {
  const { t, lang } = useI18n();
  const open = !!employee;

  const weekStarts = useMemo(() => monthMondays.map(formatLocalDate), [monthMondays]);
  const range = useMemo(() => {
    if (weekStarts.length === 0) return { start: formatLocalDate(weekMonday), end: formatLocalDate(addDays(weekMonday, 6)) };
    const sorted = [...weekStarts].sort();
    return { start: sorted[0], end: formatLocalDate(addDays(new Date(sorted[sorted.length - 1] + "T00:00:00"), 6)) };
  }, [weekStarts, weekMonday]);

  const { data: schedules } = useQuery({
    queryKey: ["emp-detail-schedules", employee?.id, weekStarts],
    enabled: !!employee && weekStarts.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*")
        .eq("employee_id", employee!.id).in("week_start", weekStarts);
      if (error) throw error;
      return data;
    },
  });

  const { data: conges } = useQuery({
    queryKey: ["emp-detail-conges", employee?.id, range.start, range.end],
    enabled: !!employee,
    queryFn: async () => {
      const { data, error } = await supabase.from("conges").select("*")
        .eq("employee_id", employee!.id).lte("date_start", range.end).gte("date_end", range.start);
      if (error) throw error;
      return data;
    },
  });

  const { data: dayComments } = useQuery({
    queryKey: ["emp-detail-day-comments", weekStarts, storeId],
    enabled: !!employee && weekStarts.length > 0,
    queryFn: async () => {
      let q = supabase.from("day_comments").select("*").in("week_start", weekStarts);
      if (storeId) q = q.eq("store_id", storeId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const weekSchedule = useMemo(
    () => schedules?.find((s: any) => s.week_start === formatLocalDate(weekMonday)) || null,
    [schedules, weekMonday]
  );

  // Total prestés mois
  const monthWorked = useMemo(() => {
    if (!schedules) return 0;
    let total = 0;
    for (const m of monthMondays) {
      const ms = formatLocalDate(m);
      const sch = schedules.find((s: any) => s.week_start === ms) || {};
      total += computeNetHours(sch).worked;
    }
    return total;
  }, [schedules, monthMondays]);

  // Absences agrégées (jours) par type pour le mois
  const monthAbsenceDays = useMemo(() => {
    const map = new Map<string, number>();
    if (!conges) return map;
    const monthDays = new Set<string>();
    for (const m of monthMondays) {
      for (let i = 0; i < 7; i++) monthDays.add(getDayDate(m, i));
    }
    for (const c of conges) {
      monthDays.forEach((d) => {
        if (d >= c.date_start && d <= c.date_end) {
          map.set(c.type, (map.get(c.type) || 0) + 1);
        }
      });
    }
    return map;
  }, [conges, monthMondays]);

  if (!employee) return null;

  const contract = Number(employee.contract_hours) || 0;
  const weekNet = weekSchedule ? computeNetHours(weekSchedule).worked : 0;
  const monthContract = contract * monthMondays.length;

  const monthLabel = weekMonday.toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE", { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            {getDisplayName(employee)}
            <span className="text-sm font-normal text-muted-foreground ml-2">· {contract}h/sem</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Résumé mois */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              {t("hours.detailMonth")} · <span className="capitalize">{monthLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">{t("hours.monthWorked")}</div>
                <div className="font-mono font-semibold">{monthWorked.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">{t("hours.monthContract")}</div>
                <div className="font-mono">{monthContract.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">{t("hours.monthGap")}</div>
                <div className={`font-mono font-semibold ${monthWorked - monthContract >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {monthWorked - monthContract >= 0 ? "+" : ""}{(monthWorked - monthContract).toFixed(1)}h
                </div>
              </div>
            </div>
          </div>

          {/* Détail semaine */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              {t("hours.detailWeek")} · {formatDateBE(weekMonday)}
              <span className="ml-2 font-mono normal-case text-foreground">
                {weekNet.toFixed(1)}h / {contract}h
              </span>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">{t("hours.detailDay")}</th>
                    <th className="text-left px-3 py-2 font-semibold">{t("hours.detailStatus")}</th>
                    <th className="text-right px-3 py-2 font-semibold">{t("hours.detailShift")}</th>
                    <th className="text-right px-3 py-2 font-semibold">{t("hours.detailNet")}</th>
                  </tr>
                </thead>
                <tbody>
                  {DAY_KEYS.map((dk, i) => {
                    const dayDate = getDayDate(weekMonday, i);
                    const start = weekSchedule ? (weekSchedule as any)[`${dk}_start`] : null;
                    const end = weekSchedule ? (weekSchedule as any)[`${dk}_end`] : null;
                    const conge = conges?.find((c: any) => dayDate >= c.date_start && dayDate <= c.date_end);
                    const isFerie = dayComments?.find((dc: any) => dc.week_start === formatLocalDate(weekMonday) && dc.day_key === dk)?.is_ferie ?? false;
                    const isRoulement = start === "ROULEMENT";
                    const isExt = start === "EXT";
                    const isLegacyFerie = start === "FERIE";
                    const hasShift = !!(start && end && !isRoulement && !isExt && !isLegacyFerie);
                    const netH = hasShift ? (() => { const g = timeToHours(end) - timeToHours(start); return g >= 6 ? g - BREAK_HOURS : g; })() : 0;

                    let statusEl: JSX.Element;
                    let shiftEl: JSX.Element = <span className="text-muted-foreground">—</span>;

                    if (conge) {
                      const Icon = CONGE_ICONS[conge.type] || HelpCircle;
                      const color = CONGE_COLORS[conge.type] || "bg-slate-500";
                      statusEl = (
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-white ${color}`}>
                            <Icon className="h-3 w-3" />
                          </span>
                          {t(`leave.${conge.type}` as any) || conge.type}
                        </span>
                      );
                    } else if (isRoulement) {
                      statusEl = <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />{t("hours.detailRotation")}</span>;
                    } else if (isExt) {
                      statusEl = <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{t("hours.detailExterior")}</span>;
                    } else if (isLegacyFerie || (isFerie && !hasShift)) {
                      statusEl = <span className="inline-flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-muted-foreground" />{t("hours.detailHoliday")}</span>;
                    } else if (hasShift) {
                      statusEl = <span className="text-emerald-700 font-medium">●</span>;
                      shiftEl = <span className="font-mono">{formatTimeBE(start)} — {formatTimeBE(end)}</span>;
                    } else {
                      statusEl = <span className="text-muted-foreground">{t("hours.detailRest")}</span>;
                    }

                    return (
                      <tr key={dk} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-1.5 capitalize font-medium">{t(`day.long.${dk}` as any)}</td>
                        <td className="px-3 py-1.5 text-sm">{statusEl}</td>
                        <td className="px-3 py-1.5 text-right">{shiftEl}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-sm">{hasShift ? `${netH.toFixed(1)}h` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Absences du mois */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              {t("hours.detailAbsences")}
            </div>
            {monthAbsenceDays.size === 0 ? (
              <div className="rounded-lg border bg-muted/20 px-3 py-4 text-sm text-muted-foreground text-center">
                {t("hours.detailNoAbsence")}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">{t("hours.detailType")}</th>
                      <th className="text-right px-3 py-2 font-semibold">{t("hours.detailDays")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(monthAbsenceDays.entries()).sort((a, b) => b[1] - a[1]).map(([type, days]) => {
                      const Icon = CONGE_ICONS[type] || HelpCircle;
                      const color = CONGE_COLORS[type] || "bg-slate-500";
                      return (
                        <tr key={type} className="border-t">
                          <td className="px-3 py-1.5">
                            <span className="inline-flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-white ${color}`}>
                                <Icon className="h-3 w-3" />
                              </span>
                              {t(`leave.${type}` as any) || type}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-semibold">{days}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}