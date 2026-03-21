import { BarChart3, Users, CalendarDays, Share2, Calendar, TableProperties, Palmtree, ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type View = "overview" | "schedule" | "recap" | "employees" | "share" | "conges";

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const links: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
  { id: "schedule", label: "Horaires", icon: CalendarDays },
  { id: "recap", label: "Récap équipe", icon: TableProperties },
  { id: "conges", label: "Congés 2026", icon: Palmtree },
  { id: "employees", label: "Équipe", icon: Users },
  { id: "share", label: "Liens vendeurs", icon: Share2 },
];

const shortcuts = [
  { label: "Équipe du jour", path: "/equipe-du-jour" },
  { label: "Planning semaine", path: "/planning-equipe" },
  { label: "Mon planning", path: "/mon-planning" },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

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
          {links.map((link) => {
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

        {!collapsed && (
          <div className="px-3 pb-3 space-y-1">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--sidebar-fg) / 0.4)" }}>
              Accès rapide
            </div>
            {shortcuts.map((s) => (
              <button
                key={s.path}
                onClick={() => navigate(s.path)}
                className="sidebar-link sidebar-link-inactive w-full flex items-center justify-between"
              >
                <span>{s.label}</span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        )}

        {collapsed && (
          <div className="px-2 pb-3 space-y-1">
            {shortcuts.map((s) => (
              <Tooltip key={s.path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(s.path)}
                    className="sidebar-link sidebar-link-inactive w-full justify-center px-0"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{s.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        <div className={`${collapsed ? "px-2" : "px-3"} pb-4`}>
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