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

  const { data: schedule } = useQuery({
    queryKey: ["mobile-schedule", employee.id, weekStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("employee_id", employee.id).eq("week_start", weekStr).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: weekSchedules } = useQuery({
    queryKey: ["mobile-week-all-schedules", currentStore?.id, weekStr],
    queryFn: async () => {
      let q = supabase.from("weekly_schedules").select("*, employees!inner(id,name,last_name,role,store_id,is_active)").eq("week_start", weekStr);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).filter((r: any) => r.employees?.is_active && (!currentStore || r.employees?.store_id === currentStore.id));
    },
  });

  const { data: conge } = useQuery({
    queryKey: ["mobile-conge", employee.id, dateStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("conges").select("*").eq("employee_id", employee.id).lte("date_start", dateStr).gte("date_end", dateStr).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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

  // Collègues du même créneau
  const colleagues = useMemo(() => {
    if (!hasShift || !weekSchedules) return [];
    return weekSchedules
      .filter((s: any) => {
        if (s.employee_id === employee.id) return false;
        const cs = s[`${dayKey}_start`]; const ce = s[`${dayKey}_end`];
        if (!cs || !ce || cs === "EXT" || cs === "ROULEMENT" || cs === "FERIE") return false;
        // Chevauchement
        return timeToHours(cs) < timeToHours(end) && timeToHours(ce) > timeToHours(start);
      })
      .map((s: any) => s.employees);
  }, [weekSchedules, hasShift, dayKey, employee.id, start, end]);

  const roleColor = getRoleColor(employee.role);

  const dayLongLabel = selectedDate.toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
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
      <div className="px-4 pt-4 space-y-3">
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

                {currentStore && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{currentStore.name}</span>
                  </div>
                )}

                {(dayFlags?.sav || dayFlags?.socloz) && (
                  <div className="flex flex-wrap gap-1.5">
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

                {colleagues.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>{t("mobile.colleagues")} ({colleagues.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {colleagues.slice(0, 8).map((c: any) => {
                        const cc = getRoleColor(c.role);
                        return (
                          <span key={c.id} className={`text-xs px-2 py-1 rounded-full ${cc.chip} ${cc.chipText}`}>
                            {getDisplayName(c)}
                          </span>
                        );
                      })}
                      {colleagues.length > 8 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">+{colleagues.length - 8}</span>
                      )}
                    </div>
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

        {/* Week summary */}
        {schedule && (
          <div className="rounded-lg border bg-card p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {t("mobile.weekOverview")}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAY_KEYS.map((dk, i) => {
                const s = (schedule as any)[`${dk}_start`]; const e = (schedule as any)[`${dk}_end`];
                const has = !!(s && e && s !== "EXT" && s !== "ROULEMENT" && s !== "FERIE");
                const g = has ? timeToHours(e) - timeToHours(s) : 0;
                const n = g >= 6 ? g - BREAK_HOURS : g;
                const isSelectedDay = i === selectedIdx;
                return (
                  <button
                    key={dk}
                    onClick={() => setSelectedDate(addDays(monday, i))}
                    className={`text-center p-1.5 rounded ${isSelectedDay ? "bg-primary/10 ring-1 ring-primary" : ""}`}
                  >
                    <div className="text-[9px] uppercase text-muted-foreground">{t(`day.short.${dk}` as any)}</div>
                    <div className={`text-xs font-mono-data font-semibold mt-0.5 ${has ? "" : "text-muted-foreground"}`}>
                      {has ? `${n.toFixed(1)}` : "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
