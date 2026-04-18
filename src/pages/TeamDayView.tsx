import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ChevronLeft, ChevronRight, Flag, MapPin, MessageSquare, Palmtree, Printer, Save, Users } from "lucide-react";
import HourlyGrid, { type HourlyGridHandle } from "@/components/team-day/HourlyGrid";
import { FnacHeader } from "@/components/FnacHeader";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatDateBE, formatTimeBE, formatLocalDate, getDisplayName } from "@/lib/format";
import { useStore } from "@/hooks/useStore";
import { useStoreEmployees } from "@/hooks/useStoreEmployees";
import { useI18n } from "@/lib/i18n";

const BREAK_HOURS = 1;
const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];
const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function timeToHours(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekDate(date: Date): string {
  return formatLocalDate(date);
}

function formatDateISO(date: Date): string {
  return formatLocalDate(date);
}

function getDayKeyFromDate(date: Date): string {
  const jsDay = date.getDay();
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_KEYS[idx];
}

const TeamDayView = () => {
  const { t } = useI18n();
  const [dayOffset, setDayOffset] = useState(0);
  const today = new Date();
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + dayOffset);
  selectedDate.setHours(0, 0, 0, 0);

  const dateStr = formatDateISO(selectedDate);
  const dayKey = getDayKeyFromDate(selectedDate);
  const dayLabel = t(`day.long.${dayKey}` as any);
  const monday = getMonday(selectedDate);
  const weekStr = formatWeekDate(monday);

  const congeLabels = (type: string) => t(`leave.${type}` as any) || type;
  const roleLabels = (role: string) => t(`role.${role}.plural` as any) || t(`role.${role}` as any) || role;

  const REQUIRED_SLOTS: Record<string, { start: number; end: number } | null> = {
    lundi: { start: 10, end: 19 }, mardi: { start: 10, end: 19 }, mercredi: { start: 10, end: 19 },
    jeudi: { start: 10, end: 19 }, vendredi: { start: 10, end: 20 }, samedi: { start: 10, end: 19 }, dimanche: null,
  };

  const { currentStore } = useStore();
  const { employees } = useStoreEmployees();

  const { data: schedules } = useQuery({
    queryKey: ["team-day-schedules", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("week_start", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: conges } = useQuery({
    queryKey: ["team-day-conges", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase.from("conges").select("*").lte("date_start", dateStr).gte("date_end", dateStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: dayComments } = useQuery({
    queryKey: ["team-day-comments", weekStr, currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("day_comments").select("*").eq("week_start", weekStr);
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const dayComment = dayComments?.find((c) => c.day_key === dayKey)?.comment || null;
  const isDayFerie = dayComments?.find((c) => c.day_key === dayKey)?.is_ferie ?? false;

  const teamDay = employees
    ?.map((emp) => {
      const schedule = schedules?.find((s) => s.employee_id === emp.id);
      const start = schedule ? (schedule as any)[`${dayKey}_start`] : null;
      const end = schedule ? (schedule as any)[`${dayKey}_end`] : null;
      const isFerie = start === "FERIE" || end === "FERIE"; // legacy data
      const isExt = start === "EXT" || end === "EXT";
      const isRoulement = start === "ROULEMENT" || end === "ROULEMENT";
      const isRepos = start === "REPOS";
      const isLocation = !!(start && (!end || end.trim() === "") && !isFerie && !isExt && !isRoulement && !isRepos && !/^\d{1,2}:\d{2}$/.test(start));
      const hasShift = !!(start && end && !isFerie && !isExt && !isRoulement && !isLocation);
      const conge = conges?.find((c) => c.employee_id === emp.id);
      const notes = schedule?.notes || null;
      let netHours = 0;
      if (hasShift) {
        const gross = timeToHours(end) - timeToHours(start);
        netHours = gross >= 6 ? gross - BREAK_HOURS : gross;
      }
      return { ...emp, start, end, hasShift, isFerie, isExt, isRoulement, isLocation, locationName: isLocation ? start : null, netHours, conge, notes };
    })
    .sort((a, b) => {
      const orderA = ROLE_ORDER.indexOf(a.role);
      const orderB = ROLE_ORDER.indexOf(b.role);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, "fr");
    });

  const working = teamDay?.filter((e) => e.hasShift && !e.conge) || [];
  const onLeave = teamDay?.filter((e) => e.conge) || [];
  const ferie = teamDay?.filter((e) => e.isFerie && !e.conge) || []; // legacy
  const ext = teamDay?.filter((e) => e.isExt && !e.conge) || [];
  const roulement = teamDay?.filter((e) => e.isRoulement && !e.conge) || [];
  const locationEmps = teamDay?.filter((e) => e.isLocation && !e.conge) || [];
  const off = teamDay?.filter((e) => !e.hasShift && !e.conge && !e.isFerie && !e.isExt && !e.isRoulement && !e.isLocation) || [];
  const isToday = dayOffset === 0;

  const workingByRole: Record<string, typeof working> = {};
  for (const emp of working) {
    if (!workingByRole[emp.role]) workingByRole[emp.role] = [];
    workingByRole[emp.role].push(emp);
  }

  const requiredSlot = REQUIRED_SLOTS[dayKey];
  const coverageAlerts: { role: string; uncoveredHours: number[] }[] = [];
  if (requiredSlot && working.length > 0) {
    for (const role of ROLE_ORDER) {
      const group = workingByRole[role] || [];
      const uncovered: number[] = [];
      for (let h = requiredSlot.start; h < requiredSlot.end; h++) {
        const covered = group.some((emp) => timeToHours(emp.start) <= h && timeToHours(emp.end) > h);
        if (!covered) uncovered.push(h);
      }
      if (uncovered.length > 0) coverageAlerts.push({ role, uncoveredHours: uncovered });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <FnacHeader title={t("teamDay.title")} subtitle={t("teamDay.subtitle")} icon={Users}>
        <Button variant="outline" size="sm" className="no-print h-8 px-2 sm:px-3 text-xs gap-1.5 border-foreground/20 text-foreground hover:bg-foreground/10" onClick={() => window.print()} title={t("action.print")} aria-label={t("action.print")}>
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("action.print")}</span>
        </Button>
      </FnacHeader>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">{dayLabel} {formatDateBE(selectedDate)}</div>
            {isToday && <span className="text-xs text-accent font-medium">{t("teamDay.today")}</span>}
          </div>
          <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3 print-summary-cards">
          <div className="rounded-lg border bg-accent/5 border-accent/20 p-3 text-center">
            <div className="text-2xl font-bold text-accent">{working.length}</div>
            <div className="text-xs text-muted-foreground">{t("teamDay.present")}</div>
          </div>
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-3 text-center">
            <div className="text-2xl font-bold text-primary">{onLeave.length}</div>
            <div className="text-xs text-muted-foreground">{t("teamDay.onLeave")}</div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{off.length + ferie.length + roulement.length}</div>
            <div className="text-xs text-muted-foreground">{ferie.length > 0 ? t("teamDay.holidayRest") : t("teamDay.rest")}</div>
          </div>
        </div>

        {dayComment && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
            <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">{dayComment}</span>
          </div>
        )}

        {(isDayFerie || ferie.length > 0) && (
          <div className="rounded-lg border border-muted bg-muted/30 p-3 mb-4 flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t("teamDay.holidayBanner")}
              {ferie.length > 0 && ` — ${ferie.length} ${t("teamDay.employeeConcerned")}`}
            </span>
          </div>
        )}

        <HourlyGrid employees={teamDay || []} date={dateStr} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            {ROLE_ORDER.map((role) => {
              const group = workingByRole[role];
              if (!group || group.length === 0) return null;
              return (
                <div key={role}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {roleLabels(role)} ({group.length})
                  </div>
                  <div className="space-y-0.5">
                    {group.map((emp) => (
                      <div key={emp.id}>
                        <div className="flex items-center justify-between py-1 px-2 rounded bg-accent/5 text-xs">
                          <span className="font-medium">{getDisplayName(emp)}</span>
                          <span className="text-muted-foreground font-mono-data text-[11px]">
                            {formatTimeBE(emp.start)}–{formatTimeBE(emp.end)} <span className="ml-1">{emp.netHours.toFixed(1)}h</span>
                          </span>
                        </div>
                        {emp.notes && (
                          <div className="ml-2 mt-0.5 mb-1 px-2 py-1 rounded bg-amber-100/80 dark:bg-amber-900/30 border-l-2 border-amber-500 text-[11px] text-amber-800 dark:text-amber-200">
                            📝 {emp.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {coverageAlerts.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t("teamDay.uncovered")} ({requiredSlot ? `${requiredSlot.start}h–${requiredSlot.end}h` : ""})
                </div>
                <div className="space-y-0.5">
                  {coverageAlerts.map(({ role, uncoveredHours }) => {
                    const ranges: string[] = [];
                    let i = 0;
                    while (i < uncoveredHours.length) {
                      const start = uncoveredHours[i];
                      let end = start;
                      while (i + 1 < uncoveredHours.length && uncoveredHours[i + 1] === end + 1) { end = uncoveredHours[++i]; }
                      ranges.push(end === start ? `${start}h` : `${start}h–${end + 1}h`);
                      i++;
                    }
                    return (
                      <div key={role} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold">{roleLabels(role)}</span>
                        <span className="text-muted-foreground">{ranges.join(", ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {onLeave.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Palmtree className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("teamDay.onLeave")}</span>
                </div>
                <div className="space-y-0.5">
                  {onLeave.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between py-1 px-2 rounded bg-primary/5 text-xs">
                      <span className="font-medium">{getDisplayName(emp)}</span>
                      <span className="text-primary text-[11px]">
                        {emp.conge ? congeLabels(emp.conge.type) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roulement.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("schedule.rotation")}</div>
                <div className="flex flex-wrap gap-1">
                  {roulement.map((emp) => (
                    <span key={emp.id} className="py-0.5 px-2 rounded bg-muted/80 text-[11px] text-muted-foreground font-medium">{getDisplayName(emp)}</span>
                  ))}
                </div>
              </div>
            )}

            {locationEmps.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("teamDay.travel" as any) || "Déplacements"}</span>
                </div>
                <div className="space-y-0.5">
                  {locationEmps.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between py-1 px-2 rounded bg-indigo-500/10 text-xs">
                      <span className="font-medium">{getDisplayName(emp)}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {emp.locationName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {off.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("teamDay.rest")}</div>
                <div className="flex flex-wrap gap-1">
                  {off.map((emp) => (
                    <span key={emp.id} className="py-0.5 px-2 rounded bg-muted/50 text-[11px] text-muted-foreground">{getDisplayName(emp)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDayView;
