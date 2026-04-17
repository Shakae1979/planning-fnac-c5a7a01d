import { Users, CalendarDays, User, UserCog, LogOut, Palmtree, Store } from "lucide-react";
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

  const isDirection = currentStore?.is_direction === true;

  const ALL_NAV_SHORTCUTS = [
    { label: t("header.teamDay"), path: "/equipe-du-jour", icon: Users, hideDirection: false },
    { label: t("header.weekPlan"), path: "/planning-equipe", icon: CalendarDays, hideDirection: false },
    { label: t("header.myPlan"), path: "/mon-planning", icon: User, hideDirection: true },
    { label: t("nav.conges"), path: "/conges", icon: Palmtree, hideDirection: false },
    { label: t("nav.myAccount"), path: "/mon-compte", icon: UserCog, hideDirection: true },
  ];

  const NAV_SHORTCUTS = isDirection
    ? ALL_NAV_SHORTCUTS.filter((s) => !s.hideDirection)
    : ALL_NAV_SHORTCUTS;

  return (
    <header className="border-b" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button onClick={() => { handleLogoClick(); navigate((role === "admin" || role === "editor") ? "/" : "/equipe-du-jour"); }} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity relative shrink-0">
            <img src="/favicon.png" alt="Planning Fnac" className="h-6 w-6" />
            <span className="hidden sm:inline text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
              Planning Fnac
            </span>
            {showEaster && (
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded-full animate-fade-in z-50" style={{ background: "hsl(var(--sidebar-active))", color: "hsl(var(--sidebar-bg))" }}>
                Crafted with ❤️ by Karim
              </span>
            )}
          </button>

          {stores.length > 1 && (
            <Select
              value={currentStore?.id || ""}
              onValueChange={(val) => {
                const s = stores.find((st) => st.id === val);
                if (s) setCurrentStore(s);
              }}
            >
              <SelectTrigger className="w-auto max-w-[120px] sm:max-w-[180px] h-8 text-xs border-none shrink-0 gap-1" style={{ background: "hsl(var(--sidebar-hover))", color: "hsl(var(--sidebar-fg))" }}>
                <Store className="h-3.5 w-3.5 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {stores.length === 1 && currentStore && (
            <span className="hidden md:flex text-xs font-medium items-center gap-1 shrink-0" style={{ color: "hsl(var(--sidebar-fg))" }}>
              <Store className="h-3.5 w-3.5" />
              {currentStore.name}
            </span>
          )}

          <div className="hidden xl:flex items-center gap-2 min-w-0">
            <div className="h-5 w-px shrink-0" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
            {Icon && <Icon className="h-5 w-5 shrink-0" style={{ color: "hsl(var(--sidebar-fg))" }} />}
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate" style={{ color: "hsl(var(--sidebar-fg))" }}>{title}</h1>
              {subtitle && (
                <p className="text-[10px] truncate" style={{ color: "hsl(var(--sidebar-fg) / 0.6)" }}>{subtitle}</p>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-1 ml-auto sm:ml-1">
            {NAV_SHORTCUTS.map((s) => {
              const active = location.pathname.startsWith(s.path);
              return (
                <button
                  key={s.path}
                  onClick={() => navigate(s.path)}
                  className={`flex items-center justify-center gap-1.5 h-8 px-2 lg:px-2.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                    active ? "" : "hover:opacity-80"
                  }`}
                  style={{
                    background: active ? "hsl(var(--sidebar-active))" : "hsl(var(--sidebar-hover))",
                    color: active ? "hsl(var(--accent-foreground))" : "hsl(var(--sidebar-fg))",
                  }}
                  title={s.label}
                  aria-label={s.label}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {children}
          <HelpFAQ />
          <LanguageSwitcher />
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-1.5 h-8 px-2 lg:px-2.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
            style={{
              background: "hsl(var(--sidebar-hover))",
              color: "hsl(var(--sidebar-fg))",
            }}
            title={t("nav.logout")}
            aria-label={t("nav.logout")}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{t("nav.logout")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
