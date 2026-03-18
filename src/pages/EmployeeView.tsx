import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Palmtree } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateLongBE, formatDateMonthBE, formatTimeBE, formatLocalDate } from "@/lib/format";

const BREAK_HOURS = 1;

function timeToHours(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

const CONGE_LABELS: Record<string, string> = {
  conge: "Congé payé",
  rtt: "RTT",
  maladie: "Maladie",
  formation: "Formation",
};

function computeNetHours(schedule: any): { gross: number; breaks: number; net: number } {
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  let gross = 0;
  let workedDays = 0;
  for (const d of days) {
    const start = schedule[`${d}_start`];
    const end = schedule[`${d}_end`];
    if (start && end) {
      gross += timeToHours(end) - timeToHours(start);
      workedDays++;
    }
  }
  const breaks = workedDays * BREAK_HOURS;
  return { gross, breaks, net: gross - breaks };
}

const DAYS = [
  { key: "lundi", label: "Lundi", offset: 0 },
  { key: "mardi", label: "Mardi", offset: 1 },
  { key: "mercredi", label: "Mercredi", offset: 2 },
  { key: "jeudi", label: "Jeudi", offset: 3 },
  { key: "vendredi", label: "Vendredi", offset: 4 },
  { key: "samedi", label: "Samedi", offset: 5 },
  { key: "dimanche", label: "Dimanche", offset: 6 },
] as const;

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

function formatWeekDate(date: Date): string {
  return formatLocalDate(date);
}

/** Get the date string (YYYY-MM-DD) for a given day offset from monday */
function getDayDate(monday: Date, offset: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

/** Check if a date falls within a conge range */
function getCongeForDate(dateStr: string, conges: any[]): any | null {
  return conges.find((c) => dateStr >= c.date_start && dateStr <= c.date_end) || null;
}

const EmployeeView = () => {
  const { employeeName } = useParams();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatWeekDate(currentMonday);

  const decodedName = employeeName ? decodeURIComponent(employeeName) : null;

  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const employee = employees?.find((e) => e.name === decodedName);

  const weeks = Array.from({ length: 4 }, (_, i) => formatWeekDate(addWeeks(currentMonday, i)));

  // Date range for conges: first monday to last sunday
  const firstMonday = formatWeekDate(currentMonday);
  const lastSunday = getDayDate(addWeeks(currentMonday, 3), 6);

  const { data: schedules } = useQuery({
    queryKey: ["employee-schedules", employee?.id, weekStr],
    enabled: !!employee,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("employee_id", employee!.id)
        .in("week_start", weeks)
        .order("week_start");
      if (error) throw error;
      return data;
    },
  });

  const { data: conges } = useQuery({
    queryKey: ["employee-conges", employee?.id, firstMonday, lastSunday],
    enabled: !!employee,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .eq("employee_id", employee!.id)
        .lte("date_start", lastSunday)
        .gte("date_end", firstMonday);
      if (error) throw error;
      return data;
    },
  });

  if (!decodedName) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold">Mon Planning Fnac</h1>
          </div>
          <p className="text-muted-foreground mb-6">Sélectionnez votre nom pour voir votre planning :</p>
          <div className="space-y-2">
            {employees?.map((emp) => (
              <button
                key={emp.id}
                onClick={() => navigate(`/mon-planning/${encodeURIComponent(emp.name)}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-secondary transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{emp.name}</div>
                  <div className="text-xs text-muted-foreground font-mono-data">{emp.contract_hours}h / semaine</div>
                </div>
              </button>
            ))}
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
          <h1 className="text-xl font-bold mb-2">Vendeur non trouvé</h1>
          <p className="text-muted-foreground mb-4">"{decodedName}" n'existe pas dans le système.</p>
          <Button variant="outline" onClick={() => navigate("/mon-planning")}>
            Choisir un vendeur
          </Button>
        </div>
      </div>
    );
  }

  const weekLabel = formatDateLongBE(currentMonday);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
              {employee.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold">{employee.name}</h1>
              <p className="text-xs text-muted-foreground font-mono-data">
                Contrat {employee.contract_hours}h / semaine
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/mon-planning")}>
            Changer
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">Semaine du {weekLabel}</div>
            <div className="text-xs text-muted-foreground">4 semaines affichées</div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {weeks.map((ws) => {
            const schedule = schedules?.find((s) => s.week_start === ws);
            const monday = new Date(ws);
            const label = formatDateMonthBE(monday);
            const isCurrentWeek = ws === formatWeekDate(getMonday(new Date()));

            return (
              <div
                key={ws}
                className={`rounded-lg border p-4 ${isCurrentWeek ? "border-accent bg-accent/5 ring-1 ring-accent/20" : "bg-card"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Semaine du {label}</span>
                    {isCurrentWeek && <span className="badge-positive">Cette semaine</span>}
                  </div>
                  {schedule && (() => {
                    const { net, breaks } = computeNetHours(schedule);
                    return (
                      <div className="flex items-center gap-1.5" title={`Brut - ${breaks}h pause = ${net.toFixed(1)}h net`}>
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-mono-data font-medium">
                          {net.toFixed(1)}h <span className="text-muted-foreground text-xs">net</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                      const start = schedule ? (schedule as any)[`${day.key}_start`] : null;
                      const end = schedule ? (schedule as any)[`${day.key}_end`] : null;
                      const hasShift = start && end;
                      const dayDate = getDayDate(monday, day.offset);
                      const conge = conges ? getCongeForDate(dayDate, conges) : null;

                      if (conge) {
                        return (
                          <div
                            key={day.key}
                            className="rounded-md p-2 text-center text-xs bg-primary/10 border border-primary/20"
                          >
                            <div className="font-medium text-muted-foreground mb-1">{day.label}</div>
                            <Palmtree className="h-3.5 w-3.5 mx-auto text-primary mb-0.5" />
                            <div className="font-medium text-primary text-[11px]">
                              {CONGE_LABELS[conge.type] || conge.type}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={day.key}
                          className={`rounded-md p-2 text-center text-xs ${
                            hasShift ? "bg-accent/10 border border-accent/20" : "bg-muted/50"
                          }`}
                        >
                          <div className="font-medium text-muted-foreground mb-1">{day.label}</div>
                          {hasShift ? (
                            <div className="font-mono-data font-medium">
                              {formatTimeBE(start)} — {formatTimeBE(end)}
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {(timeToHours(end) - timeToHours(start) - BREAK_HOURS).toFixed(1)}h net
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Repos</div>
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
