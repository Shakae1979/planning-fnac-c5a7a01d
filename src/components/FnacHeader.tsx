import { Calendar, Users, CalendarDays, User, UserCog, LogOut, Palmtree, Store } from "lucide-react";
import { HelpFAQ } from "@/components/HelpFAQ";
import { ReactNode, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { stores, currentStore, setCurrentStore } = useStore();
  const { t } = useI18n();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showEaster, setShowEaster] = useState(false);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      setShowEaster(true);
      setTimeout(() => setShowEaster(false), 3000);
    } else {
      clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 600);
    }
  };

  const NAV_SHORTCUTS = [
    { label: t("header.teamDay"), path: "/equipe-du-jour", icon: Users },
    { label: t("header.weekPlan"), path: "/planning-equipe", icon: CalendarDays },
    { label: t("header.myPlan"), path: "/mon-planning", icon: User },
    { label: t("nav.conges"), path: "/conges", icon: Palmtree },
    { label: t("nav.myAccount"), path: "/mon-compte", icon: UserCog },
  ];

  return (
    <header className="border-b" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { handleLogoClick(); navigate((role === "admin" || role === "editor") ? "/" : "/equipe-du-jour"); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity relative">
            <Calendar className="h-5 w-5" style={{ color: "hsl(var(--sidebar-active))" }} />
            <span className="text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
              planning fnac
            </span>
            {showEaster && (
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded-full animate-fade-in" style={{ background: "hsl(var(--sidebar-active))", color: "hsl(var(--sidebar-bg))" }}>
                Crafted with ❤️ by Karim
              </span>
            )}
          </button>
          <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />

          {stores.length > 1 && (
            <>
              <Select
                value={currentStore?.id || ""}
                onValueChange={(val) => {
                  const s = stores.find((st) => st.id === val);
                  if (s) setCurrentStore(s);
                }}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs border-none" style={{ background: "hsl(var(--sidebar-hover))", color: "hsl(var(--sidebar-fg))" }}>
                  <Store className="h-3.5 w-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
            </>
          )}

          {stores.length === 1 && currentStore && (
            <>
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: "hsl(var(--sidebar-fg))" }}>
                <Store className="h-3.5 w-3.5" />
                {currentStore.name}
              </span>
              <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
            </>
          )}

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
          <HelpFAQ />
          <LanguageSwitcher />
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
