import { useState, useMemo } from "react";
import scheduleData from "@/data/scheduleData.json";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { KPICards } from "@/components/dashboard/KPICards";
import { WeeklyHoursChart } from "@/components/dashboard/WeeklyHoursChart";
import { EmployeeTable } from "@/components/dashboard/EmployeeTable";
import { WeekSelector } from "@/components/dashboard/WeekSelector";
import { NotesPanel } from "@/components/dashboard/NotesPanel";
import { TeamOverview } from "@/components/dashboard/TeamOverview";

type View = "overview" | "employees" | "trends";

export interface WeekData {
  sheet: string;
  employees: { name: string; hb: number; hm: number; diff: number }[];
  total_hours: number | null;
  etp: number | null;
  budget: number | null;
  notes: string | null;
  week_start: string | null;
  managers: string[];
}

const data = scheduleData as WeekData[];

const Index = () => {
  const [view, setView] = useState<View>("overview");
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(data.length - 1);

  const currentWeek = data[selectedWeekIdx];
  const previousWeek = selectedWeekIdx > 0 ? data[selectedWeekIdx - 1] : null;

  const allEmployeeNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach((w) => w.employees.forEach((e) => names.add(e.name)));
    return Array.from(names).sort();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-card px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Planning Fnac — Tableau de Bord
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.length} semaines · {allEmployeeNames.length} collaborateurs
            </p>
          </div>
          <WeekSelector
            weeks={data}
            selectedIdx={selectedWeekIdx}
            onChange={setSelectedWeekIdx}
          />
        </header>

        <div className="p-6 space-y-6">
          {view === "overview" && (
            <>
              <KPICards current={currentWeek} previous={previousWeek} />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <WeeklyHoursChart data={data} selectedIdx={selectedWeekIdx} />
                </div>
                <NotesPanel week={currentWeek} />
              </div>
              <EmployeeTable week={currentWeek} />
            </>
          )}

          {view === "employees" && (
            <TeamOverview data={data} allNames={allEmployeeNames} />
          )}

          {view === "trends" && (
            <div className="space-y-6">
              <WeeklyHoursChart data={data} selectedIdx={selectedWeekIdx} fullWidth />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="kpi-card">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Évolution ETP</h3>
                  <div className="space-y-2">
                    {data.slice(-12).map((w, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{w.sheet}</span>
                        <span className="font-mono-data font-medium">{w.etp ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="kpi-card">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Budget vs Réel (ETP)</h3>
                  <div className="space-y-2">
                    {data.slice(-12).map((w, i) => {
                      const diff = w.etp && w.budget ? w.etp - w.budget : null;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{w.sheet}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono-data">{w.budget ?? "—"}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-mono-data">{w.etp ?? "—"}</span>
                            {diff !== null && (
                              <span className={diff > 0 ? "badge-warning" : diff < 0 ? "badge-positive" : "badge-neutral"}>
                                {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
