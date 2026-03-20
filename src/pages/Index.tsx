import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";
import { EmployeeManager } from "@/components/dashboard/EmployeeManager";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { TeamRecap } from "@/components/dashboard/TeamRecap";
import { CongesCalendar } from "@/components/dashboard/CongesCalendar";

type View = "overview" | "schedule" | "recap" | "employees" | "share" | "conges";

const Index = () => {
  const [view, setView] = useState<View>("overview");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b px-6 py-4" style={{ background: "hsl(var(--sidebar-bg))" }}>
          <h1 className="text-xl font-bold" style={{ color: "hsl(var(--sidebar-active))" }}>
            Planning Fnac 2026
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--sidebar-fg) / 0.6)" }}>
            Gestion des horaires de l'équipe
          </p>
        </header>

        <div className="p-6">
          {view === "overview" && <DashboardOverview />}
          {view === "schedule" && <ScheduleEditor />}
          {view === "recap" && <TeamRecap />}
          {view === "employees" && <EmployeeManager />}
          {view === "share" && <ShareLinks />}
          {view === "conges" && <CongesCalendar />}
        </div>
      </main>
    </div>
  );
};

export default Index;
