import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Printer, Palmtree, AlertTriangle, Flag, MapPin } from "lucide-react";
import { FnacHeader } from "@/components/FnacHeader";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { WeekNavigator } from "@/components/WeekNavigator";
import { toast } from "sonner";
import { formatDateBE, formatTimeBE, formatLocalDate, getDisplayName } from "@/lib/format";
import { useStore } from "@/hooks/useStore";
import { useStoreEmployees } from "@/hooks/useStoreEmployees";
import { useI18n } from "@/lib/i18n";
import React from "react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { ROLE_ORDER, ROLE_COLORS } from "@/lib/role-colors";

const CONGE_COLORS: Record<string, string> = {
  conge: "bg-lime-500", rtt: "bg-cyan-500", maladie: "bg-rose-600", formation: "bg-violet-500",
};

const ALL_DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
type DayKey = typeof ALL_DAY_KEYS[number];

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

  const { currentStore } = useStore();
  const { employees } = useStoreEmployees(ROLE_ORDER);
  const { scheduleStart, scheduleEnd } = useStoreSettings();
  const HOURS = Array.from({ length: scheduleEnd - scheduleStart }, (_, i) => i + scheduleStart);

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

  // Auto-include dimanche column only when at least one schedule has Sunday hours
  // or a Sunday day_comment exists for the week.
  const showSunday = useMemo(() => {
    const hasScheduleSun = (schedules || []).some((s: any) => {
      const start = s?.dimanche_start;
      const end = s?.dimanche_end;
      return (typeof start === "string" && start.trim() !== "") ||
             (typeof end === "string" && end.trim() !== "");
    });
    if (hasScheduleSun) return true;
    const hasCommentSun = (dayComments || []).some((dc: any) =>
      dc?.day_key === "dimanche" && (dc?.is_ferie || (dc?.comment && String(dc.comment).trim() !== ""))
    );
    return hasCommentSun;
  }, [schedules, dayComments]);

  const DAY_KEYS: readonly DayKey[] = showSunday ? ALL_DAY_KEYS : ALL_DAY_KEYS.slice(0, 6);
  const DAYS = DAY_KEYS.map((key) => ({ key, label: t(`day.long.${key}` as any) }));

  const getConge = (empId: string, dayIndex: number): string | null => {
    if (!conges) return null;
    const dayDate = getDayDate(currentMonday, dayIndex);
    const match = conges.find(c => c.employee_id === empId && c.date_start <= dayDate && c.date_end >= dayDate);
    return match ? match.type : null;
  };

  const GRID_START = scheduleStart * 60;
  const GRID_END = scheduleEnd * 60;
  const GRID_SPAN = GRID_END - GRID_START;

  const grouped = employees?.reduce((acc, emp) => {
    if (!acc[emp.role]) acc[emp.role] = [];
    acc[emp.role].push(emp);
    return acc;
  }, {} as Record<string, typeof employees>);


  // Férié is now managed via day_comments.is_ferie only (no schedule overwrite)

  return (
    <div className="min-h-screen bg-background">
      <FnacHeader title={t("teamWeek.title")} subtitle={t("teamWeek.subtitle")} icon={Users}>
        <div className="flex items-center gap-2">
          <WeekNavigator offset={weekOffset} onChange={setWeekOffset} />
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
                  const isFerieDay = dayComments?.find(dc => dc.day_key === day.key)?.is_ferie ?? false;
                  return (
                    <th key={day.key} className={`border-b border-r px-1 py-2 text-center font-semibold ${isFerieDay ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" : "text-muted-foreground"}`} style={{ minWidth: 140 }}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{day.label}</span>
                        {isFerieDay && <Flag className="h-3 w-3" />}
                      </div>
                      <div className="text-[10px] font-normal">{formatDateBE(dayDate)}</div>
                      {isFerieDay && <div className="text-[9px] font-bold uppercase">{t("schedule.holiday")}</div>}
                    </th>
                  );
                })}
                
              </tr>
              <tr>
                <th className="sticky left-0 z-20 bg-card border-b border-r" />
                {DAYS.map(day => {
                  const isFerieDay = dayComments?.find(dc => dc.day_key === day.key)?.is_ferie ?? false;
                  return (
                  <th key={day.key} className={`border-b border-r p-0 ${isFerieDay ? "bg-gray-200 dark:bg-gray-800" : ""}`}>
                    <div className="flex">
                      {HOURS.map(h => (
                        <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground/60 py-0.5 border-r border-border/30 last:border-r-0">{h}</div>
                      ))}
                    </div>
                  </th>
                  );
                })}
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
                      <td colSpan={DAY_KEYS.length + 1} className={`px-3 py-1.5 font-bold text-xs ${colors.text} ${colors.headerBg} border-b-2 border-t-4 border-t-foreground/20 border-l-4 ${colors.borderL}`}>
                        {roleLabels(role)} ({emps.length})
                      </td>
                    </tr>
                    {emps.map(emp => {
                      const schedule = schedules?.find(s => s.employee_id === emp.id);
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
                            const isFerieFromComments = dayComments?.find(dc => dc.day_key === day)?.is_ferie ?? false;
                            const isLegacyFerie = start === "FERIE" || end === "FERIE";
                            const isFerie = isFerieFromComments || isLegacyFerie;
                            const isExt = !isLegacyFerie && (start === "EXT" || end === "EXT");
                            const isRoulement = !isLegacyFerie && (start === "ROULEMENT" || end === "ROULEMENT");
                            const isRepos = start === "REPOS";
                            const isLocation = !!(start && (!end || end.trim() === "") && !isLegacyFerie && !isExt && !isRoulement && !isRepos && !/^\d{1,2}:\d{2}$/.test(start));
                            const hasShift = !!(start && end && !isExt && !isRoulement && !isLegacyFerie && !isLocation);

                            return (
                              <td key={day} className={`border-r p-0 relative ${isFerie ? "bg-gray-100 dark:bg-gray-800/50" : ""}`} style={{ height: 32 }}>
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
                                        <>
                                          <div
                                            className={`absolute h-5 rounded ${colors.bar} flex items-center justify-center text-[9px] font-semibold text-white shadow-sm`}
                                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                            title={`${formatTimeBE(start)} — ${formatTimeBE(end)}`}
                                          >
                                            {widthPct > 12 && (
                                              <span>{isFerie ? `🏴 ` : ""}{formatTimeBE(start)}–{formatTimeBE(end)}</span>
                                            )}
                                          </div>
                                          {isFerie && (
                                            <div className="absolute top-0 right-0.5">
                                              <Flag className="h-2.5 w-2.5 text-gray-900 dark:text-gray-100" />
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                ) : isFerie ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-gray-900 dark:bg-gray-200 opacity-80 flex items-center justify-center text-[9px] font-semibold text-white dark:text-gray-900 w-full">
                                      <Flag className="h-3 w-3 mr-0.5" />
                                      {t("schedule.holiday")}
                                    </div>
                                  </div>
                                ) : isRoulement ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-gray-400 opacity-70 flex items-center justify-center text-[9px] font-semibold text-white w-full">
                                      {t("schedule.rotation")}
                                    </div>
                                  </div>
                                ) : isLocation ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-indigo-500 opacity-80 flex items-center justify-center text-[9px] font-semibold text-white w-full gap-0.5">
                                      <MapPin className="h-3 w-3" />
                                      {start}
                                    </div>
                                  </div>
                                ) : isRepos ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-muted opacity-70 flex items-center justify-center text-[9px] font-medium text-muted-foreground w-full">
                                      Repos
                                    </div>
                                  </div>
                                ) : isExt ? (
                                  <div className="absolute inset-0 flex items-center px-0.5">
                                    <div className="h-5 rounded bg-indigo-400 opacity-70 flex items-center justify-center text-[9px] font-semibold text-white w-full">
                                      {t("teamWeek.exterior")}
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
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
