import { Calendar, Users, CalendarDays, User, LogOut, Palmtree, UserCog } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface FnacHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children?: ReactNode;
}

export function FnacHeader({ title, subtitle, icon: Icon, children }: FnacHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, signOut } = useAuth();
  const { t } = useI18n();

  const NAV_SHORTCUTS = [
    { label: t("header.teamDay"), path: "/equipe-du-jour", icon: Users },
    { label: t("header.weekPlan"), path: "/planning-equipe", icon: CalendarDays },
    { label: t("header.myPlan"), path: "/mon-planning", icon: User },
    { label: t("nav.conges"), path: "/conges", icon: Palmtree },
  ];

  return (
    <header className="border-b" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate((role === "admin" || role === "editor") ? "/" : "/equipe-du-jour")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
          <LanguageSwitcher />
          <button
            onClick={() => navigate("/mon-compte")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              location.pathname === "/mon-compte" ? "" : "hover:opacity-80"
            }`}
            style={{
              background: location.pathname === "/mon-compte" ? "hsl(var(--sidebar-active))" : "hsl(var(--sidebar-hover))",
              color: location.pathname === "/mon-compte" ? "hsl(var(--accent-foreground))" : "hsl(var(--sidebar-fg))",
            }}
            title={t("nav.myAccount")}
          >
            <UserCog className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("nav.myAccount")}</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
            style={{
              background: "hsl(var(--sidebar-hover))",
              color: "hsl(var(--sidebar-fg))",
            }}
            title={t("nav.logout")}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("nav.logout")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
