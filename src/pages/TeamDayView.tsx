import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ChevronLeft, ChevronRight, Flag, MessageSquare, Palmtree, Printer, Users } from "lucide-react";
import HourlyGrid from "@/components/team-day/HourlyGrid";
import { FnacHeader } from "@/components/FnacHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateBE, formatTimeBE, formatLocalDate } from "@/lib/format";
import { useStore } from "@/hooks/useStore";

const BREAK_HOURS = 1;

const CONGE_LABELS: Record<string, string> = {
  conge: "Congé payé",
  rtt: "Sans solde",
  maladie: "Maladie",
  formation: "Formation",
};

const ROLE_LABELS: Record<string, string> = {
  responsable: "Responsables",
  technique: "Technique",
  editorial: "Éditorial",
  stock: "Stock",
  caisse: "Caisse",
  stagiaire: "Stagiaires",
};

const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];

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

const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function getDayKeyFromDate(date: Date): string {
  const jsDay = date.getDay(); // 0=Sun
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAY_KEYS[idx];
}

const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

const TeamDayView = () => {
  const [dayOffset, setDayOffset] = useState(0);
  const today = new Date();
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + dayOffset);
  selectedDate.setHours(0, 0, 0, 0);

  const dateStr = formatDateISO(selectedDate);
  const dayKey = getDayKeyFromDate(selectedDate);
  const dayLabel = DAY_LABELS[dayKey];
  const monday = getMonday(selectedDate);
  const weekStr = formatWeekDate(monday);

  const { currentStore } = useStore();
  const { data: employees } = useQuery({
    queryKey: ["team-day-employees", currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["team-day-schedules", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: conges } = useQuery({
    queryKey: ["team-day-conges", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .lte("date_start", dateStr)
        .gte("date_end", dateStr);
      if (error) throw error;
      return data;
    },
  });

  const { currentStore } = useStore();
  const { data: dayComments } = useQuery({
    queryKey: ["team-day-comments", weekStr, currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from("day_comments")
        .select("*")
        .eq("week_start", weekStr);
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const dayComment = dayComments?.find((c) => c.day_key === dayKey)?.comment || null;

  // Build list of employees with their status for the day
  const teamDay = employees
    ?.map((emp) => {
      const schedule = schedules?.find((s) => s.employee_id === emp.id);
      const start = schedule ? (schedule as any)[`${dayKey}_start`] : null;
      const end = schedule ? (schedule as any)[`${dayKey}_end`] : null;
      const isFerie = start === "FERIE" || end === "FERIE";
      const isExt = start === "EXT" || end === "EXT";
      const hasShift = !!(start && end && !isFerie && !isExt);
      const conge = conges?.find((c) => c.employee_id === emp.id);
      const notes = schedule?.notes || null;

      let netHours = 0;
      if (hasShift) {
        netHours = timeToHours(end) - timeToHours(start) - BREAK_HOURS;
      }

      return {
        ...emp,
        start,
        end,
        hasShift,
        isFerie,
        isExt,
        netHours,
        conge,
        notes,
      };
    })
    .sort((a, b) => {
      const orderA = ROLE_ORDER.indexOf(a.role);
      const orderB = ROLE_ORDER.indexOf(b.role);
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, "fr");
    });

  const working = teamDay?.filter((e) => e.hasShift && !e.conge) || [];
  const onLeave = teamDay?.filter((e) => e.conge) || [];
  const ferie = teamDay?.filter((e) => e.isFerie && !e.conge) || [];
  const ext = teamDay?.filter((e) => e.isExt && !e.conge) || [];
  const off = teamDay?.filter((e) => !e.hasShift && !e.conge && !e.isFerie && !e.isExt) || [];

  const isToday = dayOffset === 0;

  // Group working employees by role
  const workingByRole: Record<string, typeof working> = {};
  for (const emp of working) {
    if (!workingByRole[emp.role]) workingByRole[emp.role] = [];
    workingByRole[emp.role].push(emp);
  }

  // Coverage alert: check required time slots per category
  // Mon-Thu, Sat: 10h-19h / Fri: 10h-20h / Sun-Dim: no check
  const REQUIRED_SLOTS: Record<string, { start: number; end: number } | null> = {
    lundi: { start: 10, end: 19 },
    mardi: { start: 10, end: 19 },
    mercredi: { start: 10, end: 19 },
    jeudi: { start: 10, end: 19 },
    vendredi: { start: 10, end: 20 },
    samedi: { start: 10, end: 19 },
    dimanche: null,
  };

  const requiredSlot = REQUIRED_SLOTS[dayKey];

  // For each role, find uncovered hours within the required slot
  const coverageAlerts: { role: string; uncoveredHours: number[] }[] = [];
  if (requiredSlot && working.length > 0) {
    for (const role of ROLE_ORDER) {
      const group = workingByRole[role] || [];
      const uncovered: number[] = [];
      for (let h = requiredSlot.start; h < requiredSlot.end; h++) {
        // Check if at least one employee in this role covers this hour
        const covered = group.some((emp) => {
          const empStart = timeToHours(emp.start);
          const empEnd = timeToHours(emp.end);
          return empStart <= h && empEnd > h;
        });
        if (!covered) uncovered.push(h);
      }
      if (uncovered.length > 0) {
        coverageAlerts.push({ role, uncoveredHours: uncovered });
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <FnacHeader title="Planning équipe du jour" subtitle="Qui travaille aujourd'hui ?" icon={Users}>
        <Button
          variant="outline"
          size="sm"
          className="no-print h-8 text-xs gap-1.5 border-foreground/20 text-foreground hover:bg-foreground/10"
          onClick={() => window.print()}
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimer
        </Button>
      </FnacHeader>

      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Date navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">{dayLabel} {formatDateBE(selectedDate)}</div>
            {isToday && <span className="text-xs text-accent font-medium">Aujourd'hui</span>}
          </div>
          <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-3 print-summary-cards">
          <div className="rounded-lg border bg-accent/5 border-accent/20 p-3 text-center">
            <div className="text-2xl font-bold text-accent">{working.length}</div>
            <div className="text-xs text-muted-foreground">Présents</div>
          </div>
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-3 text-center">
            <div className="text-2xl font-bold text-primary">{onLeave.length}</div>
            <div className="text-xs text-muted-foreground">En congé</div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{off.length + ferie.length}</div>
            <div className="text-xs text-muted-foreground">{ferie.length > 0 ? "Férié / Repos" : "Repos"}</div>
          </div>
        </div>

        {/* Day comment banner */}
        {dayComment && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
            <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">{dayComment}</span>
          </div>
        )}

        {/* Jour férié banner */}
        {ferie.length > 0 && (
          <div className="rounded-lg border border-muted bg-muted/30 p-3 mb-4 flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Jour férié — {ferie.length} employé(s) concerné(s)</span>
          </div>
        )}

        {/* Hourly grid */}
        <HourlyGrid employees={teamDay || []} date={dateStr} />

        {/* Compact details below grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left: employees by role */}
          <div className="space-y-3">
            {ROLE_ORDER.map((role) => {
              const group = workingByRole[role];
              if (!group || group.length === 0) return null;
              return (
                <div key={role}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {ROLE_LABELS[role] || role} ({group.length})
                  </div>
                  <div className="space-y-0.5">
                    {group.map((emp) => (
                      <div key={emp.id}>
                        <div
                          className="flex items-center justify-between py-1 px-2 rounded bg-accent/5 text-xs"
                        >
                          <span className="font-medium">{emp.name}</span>
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

          {/* Right: alerts, congés, repos */}
          <div className="space-y-3">
            {/* Coverage alerts */}
            {coverageAlerts.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Non couverts ({requiredSlot ? `${requiredSlot.start}h–${requiredSlot.end}h` : ""})
                </div>
                <div className="space-y-0.5">
                  {coverageAlerts.map(({ role, uncoveredHours }) => {
                    const ranges: string[] = [];
                    let i = 0;
                    while (i < uncoveredHours.length) {
                      const start = uncoveredHours[i];
                      let end = start;
                      while (i + 1 < uncoveredHours.length && uncoveredHours[i + 1] === end + 1) {
                        end = uncoveredHours[++i];
                      }
                      ranges.push(end === start ? `${start}h` : `${start}h–${end + 1}h`);
                      i++;
                    }
                    return (
                      <div key={role} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold">{ROLE_LABELS[role] || role}</span>
                        <span className="text-muted-foreground">{ranges.join(", ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* On leave */}
            {onLeave.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Palmtree className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">En congé</span>
                </div>
                <div className="space-y-0.5">
                  {onLeave.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between py-1 px-2 rounded bg-primary/5 text-xs"
                    >
                      <span className="font-medium">{emp.name}</span>
                      <span className="text-primary text-[11px]">
                        {emp.conge ? CONGE_LABELS[emp.conge.type] || emp.conge.type : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repos */}
            {off.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Repos</div>
                <div className="flex flex-wrap gap-1">
                  {off.map((emp) => (
                    <span
                      key={emp.id}
                      className="py-0.5 px-2 rounded bg-muted/50 text-[11px] text-muted-foreground"
                    >
                      {emp.name}
                    </span>
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
