import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Palmtree, Flag } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatDateLongBE, formatDateMonthBE, formatTimeBE, formatLocalDate, getWeekNumber, getDisplayName } from "@/lib/format";
import { FnacHeader } from "@/components/FnacHeader";
import { useI18n } from "@/lib/i18n";
import { EmployeeMobileView } from "@/components/employee/EmployeeMobileView";

const BREAK_HOURS = 1;

function timeToHours(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function computeNetHours(schedule: any, conges: any[], dayComments: any[], monday: Date, template: any | null): { gross: number; breaks: number; net: number; credited: number } {
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  let gross = 0; let breakMinutes = 0; let credited = 0;
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const dayDate = getDayDate(monday, i);
    const conge = conges.find(c => dayDate >= c.date_start && dayDate <= c.date_end);
    const isFerieDay = dayComments.find(dc => dc.day_key === d)?.is_ferie ?? false;
    const start = schedule[`${d}_start`]; const end = schedule[`${d}_end`];
    const isLegacyFerie = start === "FERIE" || end === "FERIE";

    if (conge || (isFerieDay && !start) || isLegacyFerie) {
      if (template) {
        const tStart = template[`${d}_start`]; const tEnd = template[`${d}_end`];
        if (tStart && tEnd && tStart !== "EXT" && tStart !== "ROULEMENT" && tStart !== "FERIE") {
          const tGross = timeToHours(tEnd) - timeToHours(tStart);
          credited += tGross >= 6 ? tGross - BREAK_HOURS : tGross;
        }
      }
      continue;
    }
    if (start && end && start !== "EXT" && start !== "ROULEMENT") {
      const dayGross = timeToHours(end) - timeToHours(start);
      gross += dayGross;
      if (dayGross >= 6) breakMinutes += 60;
    }
  }
  const breaks = breakMinutes / 60;
  return { gross, breaks, net: gross - breaks + credited, credited };
}

const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

const SHIFT_COLORS = [
  { bg: "bg-emerald-100 border-emerald-300", text: "text-emerald-800" },
  { bg: "bg-sky-100 border-sky-300", text: "text-sky-800" },
  { bg: "bg-amber-100 border-amber-300", text: "text-amber-800" },
  { bg: "bg-violet-100 border-violet-300", text: "text-violet-800" },
  { bg: "bg-rose-100 border-rose-300", text: "text-rose-800" },
  { bg: "bg-teal-100 border-teal-300", text: "text-teal-800" },
  { bg: "bg-orange-100 border-orange-300", text: "text-orange-800" },
  { bg: "bg-fuchsia-100 border-fuchsia-300", text: "text-fuchsia-800" },
];

function buildShiftColorMap(schedules: any[] | undefined): Map<string, number> {
  const map = new Map<string, number>(); if (!schedules) return map; let idx = 0;
  for (const schedule of schedules) {
    for (const day of DAY_KEYS) {
      const start = schedule[`${day}_start`]; const end = schedule[`${day}_end`];
      if (start && end && start !== "FERIE" && start !== "EXT") {
        const key = `${start}-${end}`;
        if (!map.has(key)) { map.set(key, idx % SHIFT_COLORS.length); idx++; }
      }
    }
  }
  return map;
}

function getMonday(date: Date): Date {
  const d = new Date(date); const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0, 0, 0, 0); return d;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + 7 * n); return d;
}

function formatWeekDate(date: Date): string { return formatLocalDate(date); }

function getDayDate(monday: Date, offset: number): string {
  const d = new Date(monday); d.setDate(d.getDate() + offset); return formatLocalDate(d);
}

function getCongeForDate(dateStr: string, conges: any[]): any | null {
  return conges.find((c) => dateStr >= c.date_start && dateStr <= c.date_end) || null;
}

const EmployeeView = () => {
  const { t } = useI18n();
  const { employeeName } = useParams();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatWeekDate(currentMonday);
  const decodedName = employeeName ? decodeURIComponent(employeeName) : null;

  const DAYS = DAY_KEYS.map((key, i) => ({ key, label: t(`day.long.${key}` as any), offset: i }));

  const congeLabels = (type: string) => t(`leave.${type}` as any) || type;

  const { currentStore } = useStore();
  const { data: employees } = useQuery({
    queryKey: ["employees-list", currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const employee = employees?.find((e) => getDisplayName(e) === decodedName || e.name === decodedName);
  const weeks = Array.from({ length: 4 }, (_, i) => formatWeekDate(addWeeks(currentMonday, i)));
  const firstMonday = formatWeekDate(currentMonday);
  const lastSunday = getDayDate(addWeeks(currentMonday, 3), 6);

  const { data: schedules } = useQuery({
    queryKey: ["employee-schedules", employee?.id, weekStr],
    enabled: !!employee,
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("employee_id", employee!.id).in("week_start", weeks).order("week_start");
      if (error) throw error;
      return data;
    },
  });

  const TEMPLATE_WEEK = "1970-01-05";
  const { data: templateSchedule } = useQuery({
    queryKey: ["employee-template", employee?.id],
    enabled: !!employee,
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("employee_id", employee!.id).eq("week_start", TEMPLATE_WEEK).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: conges } = useQuery({
    queryKey: ["employee-conges", employee?.id, firstMonday, lastSunday],
    enabled: !!employee,
    queryFn: async () => {
      const { data, error } = await supabase.from("conges").select("*").eq("employee_id", employee!.id).lte("date_start", lastSunday).gte("date_end", firstMonday);
      if (error) throw error;
      return data;
    },
  });

  const { data: dayComments } = useQuery({
    queryKey: ["employee-day-comments", weeks, currentStore?.id],
    enabled: !!employee,
    queryFn: async () => {
      let query = supabase.from("day_comments").select("*").in("week_start", weeks);
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const shiftColorMap = useMemo(() => buildShiftColorMap(schedules), [schedules]);

  // Responsive: nouvelle vue mobile/tablette < 1024px
  const [isCompact, setIsCompact] = useState<boolean>(() => typeof window !== "undefined" ? window.innerWidth < 1024 : false);
  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!decodedName) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <FnacHeader title={t("empView.myPlanning")} subtitle={t("empView.selectYourName")} icon={Calendar} />
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">{t("empView.selectName")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              {employees?.map((emp) => (
                <button key={emp.id} onClick={() => navigate(`/mon-planning/${encodeURIComponent(getDisplayName(emp))}`)}
                  className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card hover:bg-secondary transition-colors text-left">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-accent/20 flex items-center justify-center text-xs sm:text-sm font-bold text-accent shrink-0">{getDisplayName(emp).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{getDisplayName(emp)}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-mono-data">{emp.contract_hours}h</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">{t("empView.notFound")}</h1>
          <p className="text-muted-foreground mb-4">"{decodedName}" {t("empView.notFoundDesc")}</p>
          <Button variant="outline" onClick={() => navigate("/mon-planning")}>{t("empView.chooseSeller")}</Button>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return <EmployeeMobileView employee={employee} />;
  }

  const weekLabel = formatDateLongBE(currentMonday);

  return (
    <div className="min-h-screen bg-background">
      <FnacHeader title={getDisplayName(employee)} subtitle={`${t("empView.contract")} ${employee.contract_hours}h ${t("empView.weeklyContract")}`} icon={User}>
        <Button variant="outline" size="sm" className="border-foreground/20 text-foreground hover:bg-foreground/10" onClick={() => navigate("/mon-planning")}>
          {t("action.change")}
        </Button>
      </FnacHeader>

      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-center">
            <div className="text-sm font-semibold">S{getWeekNumber(currentMonday)} — {t("schedule.weekOfDate")} {weekLabel}</div>
            <div className="text-xs text-muted-foreground">{t("empView.4weeks")}</div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        {shiftColorMap.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("empView.schedules")}</span>
            {Array.from(shiftColorMap.entries()).map(([shiftKey, colorIdx]) => {
              const color = SHIFT_COLORS[colorIdx];
              const [s, e] = shiftKey.split("-");
              return (
                <span key={shiftKey} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${color.bg} ${color.text}`}>
                  {formatTimeBE(s)} — {formatTimeBE(e)}
                </span>
              );
            })}
          </div>
        )}

        <div className="space-y-4">
          {weeks.map((ws) => {
            const schedule = schedules?.find((s) => s.week_start === ws);
            const monday = new Date(ws);
            const label = formatDateMonthBE(monday);
            const isCurrentWeek = ws === formatWeekDate(getMonday(new Date()));

            return (
              <div key={ws} className={`rounded-lg border p-4 ${isCurrentWeek ? "border-accent bg-accent/5 ring-1 ring-accent/20" : "bg-card"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">S{getWeekNumber(monday)} — {t("schedule.weekOfDate")} {label}</span>
                    {isCurrentWeek && <span className="badge-positive">{t("empView.thisWeek")}</span>}
                  </div>
                  {schedule && (() => {
                    const wsConges = conges?.filter(c => c.employee_id === employee!.id) || [];
                    const wsDayComments = dayComments?.filter(dc => dc.week_start === ws) || [];
                    const { net, breaks, credited } = computeNetHours(schedule, wsConges, wsDayComments, monday, templateSchedule || null);
                    return (
                      <div className="flex items-center gap-1.5" title={`Brut - ${breaks}h pause = ${net.toFixed(1)}h net`}>
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-mono-data font-medium">
                          {net.toFixed(1)}h <span className="text-muted-foreground text-xs">{t("empView.net")}</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {DAYS.map((day) => {
                    const start = schedule ? (schedule as any)[`${day.key}_start`] : null;
                    const end = schedule ? (schedule as any)[`${day.key}_end`] : null;
                    const isSpecial = start === "FERIE" || start === "EXT" || start === "ROULEMENT";
                    const hasShift = !!(start && end && !isSpecial);
                    const dayDate = getDayDate(monday, day.offset);
                    const conge = conges ? getCongeForDate(dayDate, conges) : null;
                    const isFerie = dayComments?.find(dc => dc.week_start === ws && dc.day_key === day.key)?.is_ferie ?? false;

                    if (conge) {
                      return (
                        <div key={day.key} className="rounded-md p-2 text-center text-xs bg-primary/10 border border-primary/20">
                          <div className="font-medium text-muted-foreground mb-1">{day.label}</div>
                          <Palmtree className="h-3.5 w-3.5 mx-auto text-primary mb-0.5" />
                          <div className="font-medium text-primary text-[11px]">{congeLabels(conge.type)}</div>
                        </div>
                      );
                    }

                    const shiftKey = hasShift ? `${start}-${end}` : null;
                    const colorIdx = shiftKey ? shiftColorMap.get(shiftKey) : undefined;
                    const shiftColor = colorIdx !== undefined ? SHIFT_COLORS[colorIdx] : null;

                    return (
                      <div key={day.key} className={`rounded-md p-2 text-center text-xs border relative ${isFerie ? "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600" : hasShift && shiftColor ? `${shiftColor.bg}` : hasShift ? "bg-accent/10 border-accent/20" : "bg-muted/50 border-transparent"}`}>
                        <div className="font-medium text-muted-foreground mb-1">
                          {day.label}
                          {isFerie && <Flag className="h-2.5 w-2.5 inline ml-1 text-muted-foreground" />}
                        </div>
                        {hasShift ? (
                          <div className={`font-mono-data font-semibold ${shiftColor ? shiftColor.text : ""}`}>
                            {formatTimeBE(start)} — {formatTimeBE(end)}
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                              {(() => { const g = timeToHours(end) - timeToHours(start); return (g >= 6 ? g - BREAK_HOURS : g).toFixed(1); })()}h {t("empView.net")}
                            </div>
                          </div>
                        ) : isSpecial ? (
                          <div className="text-muted-foreground">{start === "ROULEMENT" ? t("schedule.rotation") : start === "EXT" ? t("schedule.exterior") : t("schedule.holiday")}</div>
                        ) : (
                          <div className="text-muted-foreground">{t("misc.rest")}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;
