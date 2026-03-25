import { Calendar, Users, CalendarDays, User, LogOut } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface FnacHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children?: ReactNode;
}

const NAV_SHORTCUTS = [
  { label: "Équipe du jour", path: "/equipe-du-jour", icon: Users },
  { label: "Planning semaine", path: "/planning-equipe", icon: CalendarDays },
  { label: "Mon planning", path: "/mon-planning", icon: User },
];

export function FnacHeader({ title, subtitle, icon: Icon, children }: FnacHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, signOut } = useAuth();

  return (
    <header className="border-b" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(role === "admin" ? "/" : "/equipe-du-jour")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Calendar className="h-5 w-5" style={{ color: "hsl(var(--sidebar-active))" }} />
            <span className="text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
              fnac
            </span>
          </button>
          <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" style={{ color: "hsl(var(--sidebar-fg))" }} />}
            <div>
              <h1 className="text-sm font-bold" style={{ color: "hsl(var(--sidebar-fg))" }}>{title}</h1>
              {subtitle && (
                <p className="text-[10px]" style={{ color: "hsl(var(--sidebar-fg) / 0.6)" }}>{subtitle}</p>
              )}
            </div>
          </div>
          <div className="h-5 w-px ml-1" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
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
        <div className="flex items-center gap-2">
          {children}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
            style={{
              background: "hsl(var(--sidebar-hover))",
              color: "hsl(var(--sidebar-fg))",
            }}
            title="Déconnexion"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
