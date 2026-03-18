import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";
import { EmployeeManager } from "@/components/dashboard/EmployeeManager";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { TeamRecap } from "@/components/dashboard/TeamRecap";

type View = "overview" | "schedule" | "recap" | "employees" | "share";

const Index = () => {
  const [view, setView] = useState<View>("overview");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-card px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Planning Fnac 2026
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion des horaires de l'équipe
          </p>
        </header>

        <div className="p-6">
          {view === "overview" && <DashboardOverview />}
          {view === "schedule" && <ScheduleEditor />}
          {view === "recap" && <TeamRecap />}
          {view === "employees" && <EmployeeManager />}
          {view === "share" && <ShareLinks />}
        </div>
      </main>
    </div>
  );
};

export default Index;
