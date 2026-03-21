import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, Users, CalendarDays, User } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";
import { EmployeeManager } from "@/components/dashboard/EmployeeManager";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { TeamRecap } from "@/components/dashboard/TeamRecap";
import { CongesCalendar } from "@/components/dashboard/CongesCalendar";

type View = "overview" | "schedule" | "recap" | "employees" | "share" | "conges";

const NAV_SHORTCUTS = [
  { label: "Équipe du jour", path: "/equipe-du-jour", icon: Users },
  { label: "Planning semaine", path: "/planning-equipe", icon: CalendarDays },
  { label: "Mon planning", path: "/mon-planning", icon: User },
];

const Index = () => {
  const [view, setView] = useState<View>("overview");
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between" style={{ background: "hsl(var(--sidebar-bg))" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: "hsl(var(--sidebar-active))" }} />
              <h1 className="text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
                Planning Fnac 2026
              </h1>
            </div>
            <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
            <nav className="flex items-center gap-1">
              {NAV_SHORTCUTS.map((s) => {
                const active = location.pathname.startsWith(s.path);
                return (
                  <button
                    key={s.path}
                    onClick={() => navigate(s.path)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active ? "" : "hover:opacity-80"
                    }`}
                    style={{
                      background: active ? "hsl(var(--sidebar-active))" : "hsl(var(--sidebar-hover))",
                      color: active ? "hsl(var(--accent-foreground))" : "hsl(var(--sidebar-fg))",
                    }}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <p className="text-xs" style={{ color: "hsl(var(--sidebar-fg) / 0.6)" }}>
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
