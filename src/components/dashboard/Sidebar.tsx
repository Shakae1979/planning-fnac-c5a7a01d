import { BarChart3, Users, CalendarDays, Calendar, TableProperties, Palmtree, PanelLeftClose, PanelLeftOpen, LogOut, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

type View = "overview" | "schedule" | "recap" | "team" | "conges" | "stores";

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const links: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
  { id: "schedule", label: "Horaires", icon: CalendarDays },
  { id: "recap", label: "Récap équipe", icon: TableProperties },
  { id: "conges", label: "Congés 2026", icon: Palmtree },
  { id: "team", label: "Équipe & Comptes", icon: Users },
  { id: "stores", label: "Magasins", icon: Store },
];


export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredLinks = role === "admin" ? links : (role === "editor" ? links.filter(l => l.id !== "stores") : []);
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`${collapsed ? "w-16" : "w-60"} shrink-0 h-screen flex flex-col transition-all duration-200`}
        style={{ background: "hsl(var(--sidebar-bg))" }}
      >
        <div className={`${collapsed ? "px-3 justify-center" : "px-5"} py-5 flex items-center gap-2.5 border-b border-white/10`}>
          <Calendar className="h-6 w-6 shrink-0" style={{ color: "hsl(var(--sidebar-active))" }} />
          {!collapsed && (
            <>
              <span className="text-lg font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
                fnac
              </span>
              <span className="text-xs font-medium" style={{ color: "hsl(var(--sidebar-fg))" }}>
                Planning
              </span>
            </>
          )}
        </div>

        <nav className={`flex-1 ${collapsed ? "px-2" : "px-3"} mt-4 space-y-1`}>
          {filteredLinks.map((link) => {
            const active = activeView === link.id;
            const btn = (
              <button
                key={link.id}
                onClick={() => onViewChange(link.id)}
                className={`sidebar-link w-full ${active ? "sidebar-link-active" : "sidebar-link-inactive"} ${collapsed ? "justify-center px-0" : ""}`}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {!collapsed && link.label}
              </button>
            );
            if (collapsed) {
              return (
                <Tooltip key={link.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </nav>


        <div className={`${collapsed ? "px-2" : "px-3"} pb-4 space-y-1`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="sidebar-link sidebar-link-inactive w-full justify-center text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="text-xs">Déconnexion</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Déconnexion</TooltipContent>}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="sidebar-link sidebar-link-inactive w-full justify-center"
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                {!collapsed && <span className="text-xs">Réduire</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Agrandir</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}