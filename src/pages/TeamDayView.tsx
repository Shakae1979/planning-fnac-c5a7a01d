import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, Palmtree, Users } from "lucide-react";
import HourlyGrid from "@/components/team-day/HourlyGrid";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateBE, formatTimeBE, formatLocalDate } from "@/lib/format";

const BREAK_HOURS = 1;

const CONGE_LABELS: Record<string, string> = {
  conge: "Congé payé",
  rtt: "RTT",
  maladie: "Maladie",
  formation: "Formation",
};

const ROLE_LABELS: Record<string, string> = {
  responsable: "Responsables",
  technique: "Technique",
  editorial: "Éditorial",
  stock: "Stock",
  caisse: "Caisse",
};

const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse"];

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

  const { data: employees } = useQuery({
    queryKey: ["team-day-employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
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
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Users className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-lg font-bold">Planning équipe du jour</h1>
            <p className="text-xs text-muted-foreground">Qui travaille aujourd'hui ?</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-4">
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
        <div className="grid grid-cols-3 gap-3 mb-6 print-summary-cards">
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

        {/* Jour férié banner */}
        {ferie.length > 0 && (
          <div className="rounded-lg border border-muted bg-muted/30 p-3 mb-4 flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Jour férié — {ferie.length} employé(s) concerné(s)</span>
          </div>
        )}

        {/* Hourly grid */}
        <HourlyGrid employees={teamDay || []} />

        {/* Working employees by category */}
        {ROLE_ORDER.map((role) => {
          const group = workingByRole[role];
          if (!group || group.length === 0) return null;
          return (
            <div key={role} className="mb-4 print-section">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {ROLE_LABELS[role] || role}
                </span>
                <span className="text-xs text-muted-foreground">({group.length})</span>
              </div>
              <div className="space-y-1.5 print-compact-grid">
                {group.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-md bg-accent/5 border border-accent/20 print-employee-row"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent print:hidden">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="font-medium text-sm">{emp.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono-data">
                        {formatTimeBE(emp.start)} — {formatTimeBE(emp.end)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {emp.netHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Coverage alerts */}
        {coverageAlerts.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Créneaux non couverts ({requiredSlot ? `${requiredSlot.start}h — ${requiredSlot.end}h` : ""})
            </div>
            <div className="space-y-1.5">
              {coverageAlerts.map(({ role, uncoveredHours }) => {
                // Group consecutive hours into ranges
                const ranges: string[] = [];
                let i = 0;
                while (i < uncoveredHours.length) {
                  const start = uncoveredHours[i];
                  let end = start;
                  while (i + 1 < uncoveredHours.length && uncoveredHours[i + 1] === end + 1) {
                    end = uncoveredHours[++i];
                  }
                  ranges.push(end === start ? `${start}h` : `${start}h—${end + 1}h`);
                  i++;
                }
                return (
                  <div key={role} className="flex items-center justify-between text-xs">
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
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Palmtree className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">En congé</span>
            </div>
            <div className="space-y-1.5">
              {onLeave.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-md bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{emp.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {ROLE_LABELS[emp.role] || emp.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-primary">
                    {emp.conge ? CONGE_LABELS[emp.conge.type] || emp.conge.type : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Off / Repos */}
        {off.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repos</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {off.map((emp) => (
                <div
                  key={emp.id}
                  className="py-1.5 px-3 rounded-md bg-muted/50 text-xs text-muted-foreground"
                >
                  {emp.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDayView;
