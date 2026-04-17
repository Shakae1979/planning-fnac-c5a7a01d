import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, Coffee, Palmtree, Flag, Sun, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { formatDateMonthBE, formatTimeBE, formatLocalDate, getWeekNumber, getDisplayName } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

const BREAK_HOURS = 1;
const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
type DayKey = typeof DAY_KEYS[number];

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

function buildShiftColorMap(schedule: any): Map<string, number> {
  const map = new Map<string, number>(); if (!schedule) return map; let idx = 0;
  for (const day of DAY_KEYS) {
    const s = schedule[`${day}_start`]; const e = schedule[`${day}_end`];
    if (s && e && s !== "FERIE" && s !== "EXT" && s !== "ROULEMENT") {
      const key = `${s}-${e}`;
      if (!map.has(key)) { map.set(key, idx % SHIFT_COLORS.length); idx++; }
    }
  }
  return map;
}

const ROLE_COLORS: Record<string, { bar: string; chip: string; chipText: string }> = {
  responsable: { bar: "bg-amber-500", chip: "bg-amber-100", chipText: "text-amber-800" },
  technique: { bar: "bg-sky-500", chip: "bg-sky-100", chipText: "text-sky-800" },
  editorial: { bar: "bg-violet-500", chip: "bg-violet-100", chipText: "text-violet-800" },
  stock: { bar: "bg-emerald-500", chip: "bg-emerald-100", chipText: "text-emerald-800" },
  caisse: { bar: "bg-rose-500", chip: "bg-rose-100", chipText: "text-rose-800" },
  stagiaire: { bar: "bg-teal-500", chip: "bg-teal-100", chipText: "text-teal-800" },
  vendeur: { bar: "bg-primary", chip: "bg-primary/15", chipText: "text-primary" },
};

function getRoleColor(role?: string) {
  if (!role) return ROLE_COLORS.vendeur;
  const key = role.toLowerCase();
  for (const [k, v] of Object.entries(ROLE_COLORS)) if (key.includes(k)) return v;
  return ROLE_COLORS.vendeur;
}

function timeToHours(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function getMonday(date: Date): Date {
  const d = new Date(date); const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0); return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

interface Props {
  employee: any;
}

export const EmployeeMobileView = ({ employee }: Props) => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { currentStore } = useStore();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const monday = getMonday(selectedDate);
  const weekStr = formatLocalDate(monday);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const selectedIdx = Math.floor((selectedDate.getTime() - monday.getTime()) / 86400000);
  const dayKey = DAY_KEYS[selectedIdx];
  const dateStr = formatLocalDate(selectedDate);

  // 4 semaines à partir de la semaine courante (basée sur today, pas selectedDate)
  const todayMonday = useMemo(() => getMonday(today), []);
  const fourWeeks = useMemo(() => Array.from({ length: 4 }, (_, i) => addDays(todayMonday, i * 7)), [todayMonday]);
  const fourWeeksStr = useMemo(() => fourWeeks.map(formatLocalDate), [fourWeeks]);

  const { data: schedules } = useQuery({
    queryKey: ["mobile-4w-schedules", employee.id, fourWeeksStr.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("employee_id", employee.id).in("week_start", fourWeeksStr);
      if (error) throw error;
      return data || [];
    },
  });

  const schedule = schedules?.find((s: any) => s.week_start === weekStr);

  const lastSunday = formatLocalDate(addDays(todayMonday, 27));
  const firstMonday = formatLocalDate(todayMonday);

  const { data: conges } = useQuery({
    queryKey: ["mobile-4w-conges", employee.id, firstMonday, lastSunday],
    queryFn: async () => {
      const { data, error } = await supabase.from("conges").select("*").eq("employee_id", employee.id).lte("date_start", lastSunday).gte("date_end", firstMonday);
      if (error) throw error;
      return data || [];
    },
  });

  const conge = conges?.find((c: any) => dateStr >= c.date_start && dateStr <= c.date_end) || null;

  const { data: dayComment } = useQuery({
    queryKey: ["mobile-day-comment", weekStr, dayKey, currentStore?.id],
    queryFn: async () => {
      let q = supabase.from("day_comments").select("*").eq("week_start", weekStr).eq("day_key", dayKey);
      if (currentStore) q = q.eq("store_id", currentStore.id);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: dayFlags } = useQuery({
    queryKey: ["mobile-day-flags", employee.id, dateStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_day_flags").select("*").eq("employee_id", employee.id).eq("date", dateStr).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const start = schedule ? (schedule as any)[`${dayKey}_start`] : null;
  const end = schedule ? (schedule as any)[`${dayKey}_end`] : null;
  const isFerie = dayComment?.is_ferie ?? false;
  const isExt = start === "EXT";
  const isRoulement = start === "ROULEMENT";
  const isLegacyFerie = start === "FERIE";
  const hasShift = !!(start && end && !isExt && !isRoulement && !isLegacyFerie);

  const grossHours = hasShift ? timeToHours(end) - timeToHours(start) : 0;
  const netHours = grossHours >= 6 ? grossHours - BREAK_HOURS : grossHours;

  const roleColor = getRoleColor(employee.role);
  const shiftColorMap = useMemo(() => {
    const map = new Map<string, number>(); if (!schedules) return map; let idx = 0;
    for (const sched of schedules) {
      for (const day of DAY_KEYS) {
        const s = (sched as any)[`${day}_start`]; const e = (sched as any)[`${day}_end`];
        if (s && e && s !== "FERIE" && s !== "EXT" && s !== "ROULEMENT") {
          const key = `${s}-${e}`;
          if (!map.has(key)) { map.set(key, idx % SHIFT_COLORS.length); idx++; }
        }
      }
    }
    return map;
  }, [schedules]);

  const dayLongLabel = selectedDate.toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b shrink-0">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${roleColor.chip} ${roleColor.chipText}`}>
              {getDisplayName(employee).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{getDisplayName(employee)}</div>
              <div className="text-xs text-muted-foreground font-mono-data">{employee.contract_hours}h {t("empView.weeklyContract")}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/mon-planning")}>{t("action.change")}</Button>
        </div>

        {/* Week nav */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-xs font-semibold">S{getWeekNumber(monday)} — {formatDateMonthBE(monday)}</div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day strip */}
        <div className="px-2 pb-3 flex items-center justify-between gap-1">
          {weekDays.map((d, i) => {
            const isSelected = formatLocalDate(d) === dateStr;
            const isToday = formatLocalDate(d) === formatLocalDate(today);
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${
                  isSelected ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wide ${isSelected ? "" : "text-muted-foreground"}`}>
                  {t(`day.short.${DAY_KEYS[i]}` as any)}
                </span>
                <span className={`text-base font-semibold mt-0.5 ${isToday && !isSelected ? "text-primary" : ""}`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold capitalize">{dayLongLabel}</h2>
          {isFerie && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <Flag className="h-3 w-3" /> {t("schedule.holiday")}
            </span>
          )}
        </div>

        {conge ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
            <Palmtree className="h-10 w-10 mx-auto text-primary mb-2" />
            <div className="font-semibold text-primary">{t(`leave.${conge.type}` as any) || conge.type}</div>
            {conge.notes && <div className="text-sm text-muted-foreground mt-1">{conge.notes}</div>}
          </div>
        ) : hasShift ? (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="flex">
              <div className={`w-1.5 ${roleColor.bar}`} />
              <div className="flex-1 p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono-data">
                    {formatTimeBE(start)} <span className="text-muted-foreground text-base font-normal">→</span> {formatTimeBE(end)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold font-mono-data">{netHours.toFixed(1)}h</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("empView.net")}</div>
                  </div>
                </div>

                {grossHours >= 6 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Coffee className="h-3.5 w-3.5" />
                    <span>{t("mobile.breakIncluded")}</span>
                  </div>
                )}

                {(dayFlags?.sav || dayFlags?.socloz) && (
                  <div className="flex flex-wrap gap-1.5 border-t pt-3">
                    {dayFlags.sav && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">SAV</span>}
                    {dayFlags.socloz && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800">SOCLOZ</span>}
                  </div>
                )}

                {dayFlags?.comment && (
                  <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-md p-2">
                    <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span>{dayFlags.comment}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isExt || isRoulement ? (
          <div className="rounded-xl border bg-card p-5 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <div className="font-semibold">{isExt ? t("schedule.exterior") : t("schedule.rotation")}</div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed bg-muted/30 p-8 text-center">
            <Sun className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <div className="font-semibold text-muted-foreground">{t("mobile.dayOff")}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("mobile.dayOffDesc")}</div>
          </div>
        )}

        {dayComment?.comment && (
          <div className="rounded-lg border bg-card p-3 flex items-start gap-2">
            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="text-sm">{dayComment.comment}</div>
          </div>
        )}

        {/* 4-week overview */}
        <div className="rounded-lg border bg-card p-3 mt-2 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold mb-2 shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {t("mobile.weekOverview")} <span className="text-muted-foreground font-normal">· {t("empView.4weeks")}</span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col gap-1.5">
            {fourWeeks.map((wMonday, wIdx) => {
              const ws = fourWeeksStr[wIdx];
              const wSchedule = schedules?.find((s: any) => s.week_start === ws);
              const isCurrentWeek = ws === formatLocalDate(todayMonday);
              const wMondayStr = formatLocalDate(wMonday);
              return (
                <div key={ws} className="flex-1 min-h-0 flex flex-col">
                  <div className={`text-[10px] mb-0.5 shrink-0 ${isCurrentWeek ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    S{getWeekNumber(wMonday)} · {wMondayStr.slice(8, 10)}/{wMondayStr.slice(5, 7)}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
                    {DAY_KEYS.map((dk, i) => {
                      const s = wSchedule ? (wSchedule as any)[`${dk}_start`] : null;
                      const e = wSchedule ? (wSchedule as any)[`${dk}_end`] : null;
                      const isSpecial = s === "EXT" || s === "ROULEMENT" || s === "FERIE";
                      const has = !!(s && e && !isSpecial);
                      const dayDate = addDays(wMonday, i);
                      const dayDateStr = formatLocalDate(dayDate);
                      const dayConge = conges?.find((c: any) => dayDateStr >= c.date_start && dayDateStr <= c.date_end);
                      const isSelectedDay = dayDateStr === dateStr;
                      const shiftKey = has ? `${s}-${e}` : null;
                      const colorIdx = shiftKey ? shiftColorMap.get(shiftKey) : undefined;
                      const shiftColor = colorIdx !== undefined ? SHIFT_COLORS[colorIdx] : null;
                      return (
                        <button
                          key={dk}
                          onClick={() => setSelectedDate(dayDate)}
                          className={`text-center px-0.5 py-1 rounded border transition-all flex flex-col justify-center min-h-0 ${
                            isSelectedDay ? "ring-2 ring-primary" : ""
                          } ${dayConge ? "bg-primary/10 border-primary/30" : has && shiftColor ? shiftColor.bg : "border-transparent bg-muted/30"}`}
                        >
                          <div className={`text-[8px] uppercase leading-none ${has && shiftColor ? shiftColor.text : "text-muted-foreground"}`}>
                            {t(`day.short.${dk}` as any)} {dayDate.getDate()}
                          </div>
                          {dayConge ? (
                            <div className="text-[9px] font-semibold text-primary leading-tight mt-0.5">
                              {((t(`leave.${dayConge.type}.short` as any) || "CG") as string).slice(0, 4)}
                            </div>
                          ) : has ? (
                            <div className={`text-[9px] font-mono-data font-semibold leading-tight mt-0.5 ${shiftColor ? shiftColor.text : ""}`}>
                              {formatTimeBE(s).replace("h", "")}
                              <div className="text-[8px] font-normal opacity-80">{formatTimeBE(e).replace("h", "")}</div>
                            </div>
                          ) : isSpecial ? (
                            <div className="text-[8px] text-muted-foreground mt-0.5">
                              {s === "EXT" ? "EXT" : s === "ROULEMENT" ? "ROUL" : "FÉR"}
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground/60 mt-0.5">—</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
