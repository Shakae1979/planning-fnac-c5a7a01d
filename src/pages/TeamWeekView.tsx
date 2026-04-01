import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Users, Printer, Palmtree, AlertTriangle, Flag } from "lucide-react";
import { FnacHeader } from "@/components/FnacHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateBE, formatTimeBE, formatLocalDate, getDisplayName } from "@/lib/format";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import React from "react";

const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];

const ROLE_COLORS: Record<string, { bar: string; text: string; bg: string; headerBg: string }> = {
  responsable: { bar: "bg-red-500",     text: "text-red-800 dark:text-red-200",     bg: "bg-red-50 dark:bg-red-950/20",     headerBg: "bg-red-100 dark:bg-red-900/40"     },
  technique:   { bar: "bg-orange-500",  text: "text-orange-800 dark:text-orange-200",bg: "bg-orange-50 dark:bg-orange-950/20",headerBg: "bg-orange-100 dark:bg-orange-900/40" },
  editorial:   { bar: "bg-yellow-500",  text: "text-yellow-800 dark:text-yellow-200",bg: "bg-yellow-50 dark:bg-yellow-950/20",headerBg: "bg-yellow-100 dark:bg-yellow-900/40" },
  stock:       { bar: "bg-blue-500",    text: "text-blue-800 dark:text-blue-200",   bg: "bg-blue-50 dark:bg-blue-950/20",   headerBg: "bg-blue-100 dark:bg-blue-900/40"   },
  caisse:      { bar: "bg-emerald-500", text: "text-emerald-800 dark:text-emerald-200",bg: "bg-emerald-50 dark:bg-emerald-950/20",headerBg: "bg-emerald-100 dark:bg-emerald-900/40"},
  stagiaire:   { bar: "bg-pink-500",    text: "text-pink-800 dark:text-pink-200",   bg: "bg-pink-50 dark:bg-pink-950/20",   headerBg: "bg-pink-100 dark:bg-pink-900/40"   },
};

const CONGE_COLORS: Record<string, string> = {
  conge: "bg-lime-500", rtt: "bg-cyan-500", maladie: "bg-rose-600", formation: "bg-violet-500",
};

const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 9);

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

function formatWeekDate(date: Date): string { return formatLocalDate(date); }

function getDayDate(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIndex);
  return formatLocalDate(d);
}

function timeToMinutes(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

const TeamWeekView = () => {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatWeekDate(currentMonday);
  const weekSunday = new Date(currentMonday);
  weekSunday.setDate(weekSunday.getDate() + 6);
  const weekEndStr = formatWeekDate(weekSunday);
  const saturday = new Date(currentMonday);
  saturday.setDate(saturday.getDate() + 5);

  const roleLabels = (role: string) => t(`role.${role}.plural` as any) || t(`role.${role}` as any) || role;
  const congeLabels = (type: string) => t(`leave.${type}` as any) || type;

  const DAYS = DAY_KEYS.map((key) => ({ key, label: t(`day.long.${key}` as any) }));

  const { currentStore } = useStore();
  const { data: employees } = useQuery({
    queryKey: ["team-week-employees", currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data?.sort((a, b) => {
        const ra = ROLE_ORDER.indexOf(a.role);
        const rb = ROLE_ORDER.indexOf(b.role);
        if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
        return a.name.localeCompare(b.name, "fr");
      });
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["team-week-schedules", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("week_start", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: conges } = useQuery({
    queryKey: ["team-week-conges", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("conges").select("*").lte("date_start", weekEndStr).gte("date_end", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: dayComments } = useQuery({
    queryKey: ["team-week-day-comments", weekStr, currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("day_comments").select("*").eq("week_start", weekStr);
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getConge = (empId: string, dayIndex: number): string | null => {
    if (!conges) return null;
    const dayDate = getDayDate(currentMonday, dayIndex);
    const match = conges.find(c => c.employee_id === empId && c.date_start <= dayDate && c.date_end >= dayDate);
    return match ? match.type : null;
  };

  const GRID_START = 9 * 60;
  const GRID_END = 21 * 60;
  const GRID_SPAN = GRID_END - GRID_START;

  const grouped = employees?.reduce((acc, emp) => {
    if (!acc[emp.role]) acc[emp.role] = [];
    acc[emp.role].push(emp);
    return acc;
  }, {} as Record<string, typeof employees>);

  const getWeekTotal = (empId: string): number => {
    const schedule = schedules?.find(s => s.employee_id === empId);
    if (!schedule) return 0;
    let totalMin = 0;
    let workedDays = 0;
    DAY_KEYS.forEach((day, di) => {
      const congeType = getConge(empId, di);
      if (congeType) return;
      const start = (schedule as any)[`${day}_start`];
      const end = (schedule as any)[`${day}_end`];
      if (start && end && start !== "FERIE" && start !== "EXT" && start !== "ROULEMENT") {
        totalMin += timeToMinutes(end) - timeToMinutes(start);
        workedDays++;
      }
    });
    return Math.round(((totalMin - workedDays * 60) / 60) * 100) / 100;
  };

  const ferieMutation = useMutation({
    mutationFn: async (dayKey: string) => {
      if (!employees || !schedules) return;
      const promises = employees.map(async (emp) => {
        const existing = schedules.find(s => s.employee_id === emp.id);
        const payload = { [`${dayKey}_start`]: "FERIE", [`${dayKey}_end`]: "FERIE" };
        if (existing) {
          const { error } = await supabase.from("weekly_schedules").update(payload).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("weekly_schedules").insert({ employee_id: emp.id, week_start: weekStr, ...payload });
          if (error) throw error;
        }
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-week-schedules", weekStr] });
      queryClient.invalidateQueries({ queryKey: ["schedules", weekStr] });
      toast.success(t("teamWeek.markedHoliday"));
    },
    onError: (err) => toast.error("Error: " + (err as Error).message),
  });

  return (
    <div className="min-h-screen bg-background">
      <FnacHeader title={t("teamWeek.title")} subtitle={t("teamWeek.subtitle")} icon={Users}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="border-foreground/20 text-foreground hover:bg-foreground/10" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[200px]">
            <div className="text-sm font-semibold" style={{ color: "hsl(var(--sidebar-fg))" }}>
              {formatDateBE(currentMonday)} — {formatDateBE(saturday)}
            </div>
          </div>
          <Button variant="outline" size="icon" className="border-foreground/20 text-foreground hover:bg-foreground/10" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="ml-2 border-foreground/20 text-foreground hover:bg-foreground/10" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1" /> {t("action.print")}
          </Button>
        </div>
      </FnacHeader>

      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-3 mb-4 text-xs no-print">
          {ROLE_ORDER.map(role => (
            <span key={role} className="flex items-center gap-1.5">
              <span className={`inline-block w-3 h-3 rounded ${ROLE_COLORS[role]?.bar}`} />
              {roleLabels(role)}
            </span>
          ))}
          <span className="ml-2 border-l pl-2 flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-lime-500" /> {t("leave.conge")}</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-violet-500" /> {t("leave.formation")}</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-rose-600" /> {t("leave.maladie")}</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-cyan-500" /> {t("leave.rtt")}</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-gray-900 dark:bg-gray-100" /> {t("teamWeek.ferie")}</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-indigo-400" /> {t("teamWeek.exterior")}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-card border-b border-r px-2 py-2 text-left font-semibold text-muted-foreground w-[140px]">
                  {t("teamWeek.seller")}
                </th>
                {DAYS.map((day, di) => {
                  const dayDate = new Date(currentMonday);
                  dayDate.setDate(dayDate.getDate() + di);
                  return (
                    <th key={day.key} className="border-b border-r px-1 py-2 text-center font-semibold text-muted-foreground" style={{ minWidth: 140 }}>
                      <div className="flex items-center justify-center gap-1"><span>{day.label}</span></div>
                      <div className="text-[10px] font-normal">{formatDateBE(dayDate)}</div>
                    </th>
                  );
                })}
                <th className="border-b px-2 py-2 text-center font-semibold text-muted-foreground w-[50px]">{t("teamWeek.total")}</th>
              </tr>
              <tr>
                <th className="sticky left-0 z-20 bg-card border-b border-r" />
                {DAYS.map(day => (
                  <th key={day.key} className="border-b border-r p-0">
                    <div className="flex">
                      {HOURS.map(h => (
                        <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground/60 py-0.5 border-r border-border/30 last:border-r-0">{h}</div>
                      ))}
                    </div>
                  </th>
                ))}
                <th className="border-b" />
              </tr>
              {dayComments && dayComments.some(dc => dc.comment.trim()) && (
                <tr>
                  <th className="sticky left-0 z-20 bg-card border-b border-r px-2 py-1 text-left text-[10px] text-muted-foreground font-normal">
                    {t("teamWeek.notes")}
                  </th>
                  {DAYS.map(day => {
                    const comment = dayComments?.find(dc => dc.day_key === day.key)?.comment || "";
                    return (
                      <th key={day.key + "-comment"} className="border-b border-r px-1 py-1 text-center font-normal">
                        {comment.trim() ? (
                          <span className="text-[10px] font-semibold italic px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--warning) / 0.15)", color: "hsl(var(--warning))" }} title={comment}>{comment}</span>
                        ) : null}
                      </th>
                    );
                  })}
                  <th className="border-b" />
                </tr>
              )}
            </thead>
            <tbody>
              {ROLE_ORDER.map(role => {
                const emps = grouped?.[role];
                if (!emps || emps.length === 0) return null;
                const colors = ROLE_COLORS[role] || ROLE_COLORS.caisse;
                return (
                  <React.Fragment key={role}>
                    <tr>
                      <td colSpan={DAY_KEYS.length + 2} className={`px-3 py-1.5 font-bold text-xs ${colors.text} ${colors.headerBg} border-b`}>
                        {roleLabels(role)} ({emps.length})
                      </td>
                    </tr>
                    {emps.map(emp => {
                      const schedule = schedules?.find(s => s.employee_id === emp.id);
                      const weekTotal = getWeekTotal(emp.id);
                      const diff = weekTotal - emp.contract_hours;
                      return (
                        <tr key={emp.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="sticky left-0 z-10 bg-card border-r px-2 py-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full ${colors.bar} flex items-center justify-center text-[10px] font-bold text-white`}>
                                {getDisplayName(emp).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium truncate max-w-[120px]">{getDisplayName(emp)}</span>
                            </div>
                          </td>
                          {DAY_KEYS.map((day, di) => {
                            const congeType = getConge(emp.id, di);
                            const start = schedule ? (schedule as any)[`${day}_start`] : null;
                            const end = schedule ? (schedule as any)[`${day}_end`] : null;
                            const isFerie = dayComments?.find(dc => dc.day_key === day)?.is_ferie ?? false;
                            const isExt = start === "EXT" || end === "EXT";
                            const isRoulement = start === "ROULEMENT" || end === "ROULEMENT";
                            const hasShift = !!(start && end && !isExt && !isRoulement && start !== "FERIE" && end !== "FERIE");

                            return (
                              <td key={day} className="border-r p-0 relative" style={{ height: 32 }}>
                                <div className="absolute inset-0 flex">
                                  {HOURS.map(h => (
                                    <div key={h} className="flex-1 border-r border-border/10 last:border-r-0" />
                                  ))}
                                </div>

                                {congeType ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className={`h-5 rounded ${CONGE_COLORS[congeType] || "bg-yellow-400"} opacity-70 flex items-center justify-center text-[9px] font-semibold text-white w-full`}>
                                      <Palmtree className="h-3 w-3 mr-0.5" />
                                      {congeLabels(congeType)}
                                    </div>
                                  </div>
                                ) : isFerie ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-gray-900 dark:bg-gray-100 opacity-80 flex items-center justify-center text-[9px] font-semibold text-white dark:text-gray-900 w-full">
                                      <Flag className="h-3 w-3 mr-0.5" />
                                      {t("teamWeek.ferie")}
                                    </div>
                                  </div>
                                ) : isExt ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-indigo-400 opacity-70 flex items-center justify-center text-[9px] font-semibold text-white w-full">
                                      {t("teamWeek.exterior")}
                                    </div>
                                  </div>
                                ) : isRoulement ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-gray-400 opacity-70 flex items-center justify-center text-[9px] font-semibold text-white w-full">
                                      {t("schedule.rotation")}
                                    </div>
                                  </div>
                                ) : hasShift ? (
                                  <div className="absolute inset-0 flex items-center">
                                    {(() => {
                                      const startMin = timeToMinutes(start);
                                      const endMin = timeToMinutes(end);
                                      const clampStart = Math.max(startMin, GRID_START);
                                      const clampEnd = Math.min(endMin, GRID_END);
                                      const leftPct = ((clampStart - GRID_START) / GRID_SPAN) * 100;
                                      const widthPct = ((clampEnd - clampStart) / GRID_SPAN) * 100;
                                      return (
                                        <div
                                          className={`absolute h-5 rounded ${colors.bar} opacity-80 flex items-center justify-center text-[9px] font-semibold text-white shadow-sm`}
                                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                          title={`${formatTimeBE(start)} — ${formatTimeBE(end)}`}
                                        >
                                          {widthPct > 12 && (
                                            <span>{formatTimeBE(start)}–{formatTimeBE(end)}</span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-gray-400 opacity-70 flex items-center justify-center text-[9px] font-semibold text-white w-full">
                                      Roulement
                                    </div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1.5 text-center font-mono-data">
                            {weekTotal > 0 ? (
                              <div>
                                <span className="font-semibold">{weekTotal}h</span>
                                {diff !== 0 && (
                                  <div className={`text-[9px] ${diff > 0 ? "text-amber-600" : "text-red-600"}`}>
                                    {diff > 0 ? "+" : ""}{diff}h
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span>{t("teamWeek.breakNote")}</span>
        </div>
      </div>
    </div>
  );
};

export default TeamWeekView;
