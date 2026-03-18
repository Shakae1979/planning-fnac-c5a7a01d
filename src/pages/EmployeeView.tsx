import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const DAYS = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
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
  return date.toISOString().split("T")[0];
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

  // Fetch 4 weeks of schedules for this employee
  const weeks = Array.from({ length: 4 }, (_, i) => formatWeekDate(addWeeks(currentMonday, i)));

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

  if (!decodedName) {
    // Show employee selector
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

  const weekLabel = currentMonday.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Week navigation */}
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

        {/* 4-week schedule cards */}
        <div className="space-y-4">
          {weeks.map((ws) => {
            const schedule = schedules?.find((s) => s.week_start === ws);
            const monday = new Date(ws);
            const label = monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
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
                  {schedule && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-mono-data font-medium">
                        {schedule.hours_modified ?? schedule.hours_base ?? 0}h
                      </span>
                    </div>
                  )}
                </div>

                {schedule ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                      const start = (schedule as any)[`${day.key}_start`];
                      const end = (schedule as any)[`${day.key}_end`];
                      const hasShift = start && end;

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
                              {start} — {end}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Repos</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Planning non encore défini</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;
