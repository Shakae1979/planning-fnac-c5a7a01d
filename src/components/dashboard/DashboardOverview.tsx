import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Users, CalendarDays, AlertTriangle } from "lucide-react";

export function DashboardOverview() {
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ["all-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*, employees(name)");
      if (error) throw error;
      return data;
    },
  });

  const totalEmployees = employees?.length ?? 0;
  const totalWeeksPlanned = new Set(schedules?.map((s) => s.week_start)).size;
  const totalHoursPlanned = schedules?.reduce((sum, s) => sum + (s.hours_modified ?? s.hours_base ?? 0), 0) ?? 0;
  const schedulesWithDiff = schedules?.filter((s) => (s.hours_modified ?? 0) !== (s.hours_base ?? 0)).length ?? 0;

  const cards = [
    { label: "Collaborateurs actifs", value: totalEmployees, icon: Users },
    { label: "Semaines planifiées", value: totalWeeksPlanned, icon: CalendarDays },
    { label: "Écarts détectés", value: schedulesWithDiff, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold font-mono-data">{card.value}</span>
          </div>
        ))}
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Équipe 2026</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {employees?.map((emp) => (
            <div key={emp.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50">
              <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {emp.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium">{emp.name}</div>
                <div className="text-xs text-muted-foreground font-mono-data">{emp.contract_hours}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Pour commencer</h3>
        <p className="text-sm text-muted-foreground">
          Allez dans <strong>Horaires</strong> pour créer et modifier les plannings semaine par semaine.
          Partagez ensuite les <strong>Liens vendeurs</strong> pour que chaque collaborateur puisse consulter son planning.
        </p>
      </div>
    </div>
  );
}
