import { BarChart3, Users, CalendarDays, Share2, Calendar, TableProperties, Palmtree, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  return (
    <aside className="w-60 shrink-0 h-screen flex flex-col" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/10">
        <Calendar className="h-6 w-6" style={{ color: "hsl(var(--sidebar-active))" }} />
        <span className="text-lg font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
          fnac
        </span>
        <span className="text-xs font-medium" style={{ color: "hsl(var(--sidebar-fg))" }}>
          Planning
        </span>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1">
        {links.map((link) => {
          const active = activeView === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onViewChange(link.id)}
              className={`sidebar-link w-full ${active ? "sidebar-link-active" : "sidebar-link-inactive"}`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </button>
          );
        })}
      </nav>

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

      <div className="px-5 py-4 text-xs" style={{ color: "hsl(var(--sidebar-fg) / 0.5)" }}>
        Données 2026
      </div>
    </aside>
  );
}
