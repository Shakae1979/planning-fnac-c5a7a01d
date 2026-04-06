import { BarChart3, Users, CalendarDays, Calendar, TableProperties, Palmtree, PanelLeftClose, PanelLeftOpen, LogOut, Store, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

type View = "overview" | "schedule" | "recap" | "team" | "conges" | "stores" | "settings";

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const linkDefs: { id: View; labelKey: string; icon: React.ElementType }[] = [
  { id: "overview", labelKey: "nav.overview", icon: BarChart3 },
  { id: "schedule", labelKey: "nav.schedule", icon: CalendarDays },
  { id: "recap", labelKey: "nav.recap", icon: TableProperties },
  { id: "conges", labelKey: "nav.conges", icon: Palmtree },
  { id: "team", labelKey: "nav.team", icon: Users },
  { id: "stores", labelKey: "nav.stores", icon: Store },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];


export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
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

  const links = linkDefs.map(l => ({ ...l, label: t(l.labelKey as any) }));
  const filteredLinks = role === "admin" ? links : (role === "editor" ? links.filter(l => l.id !== "stores") : []);
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`${collapsed ? "w-16" : "w-60"} shrink-0 h-screen flex flex-col transition-all duration-200`}
        style={{ background: "hsl(var(--sidebar-bg))" }}
      >
        <div onClick={handleLogoClick} className={`${collapsed ? "px-3 justify-center" : "px-5"} py-5 flex items-center gap-2.5 border-b border-white/10 cursor-pointer relative`}>
          <Calendar className="h-6 w-6 shrink-0" style={{ color: "hsl(var(--sidebar-active))" }} />
          {!collapsed && (
            <>
              <span className="text-lg font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
                fnac
              </span>
              <span className="text-xs font-medium" style={{ color: "hsl(var(--sidebar-fg))" }}>
                {t("nav.planning")}
              </span>
            </>
          )}
          {showEaster && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded-full animate-fade-in z-10" style={{ background: "hsl(var(--sidebar-active))", color: "hsl(var(--sidebar-bg))" }}>
              Crafted with ❤️ by Karim
            </span>
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
                onClick={() => navigate("/mon-compte")}
                className="sidebar-link sidebar-link-inactive w-full justify-center"
              >
                <UserCog className="h-4 w-4" />
                {!collapsed && <span className="text-xs">{t("nav.myAccount")}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{t("nav.myAccount")}</TooltipContent>}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="sidebar-link sidebar-link-inactive w-full justify-center text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="text-xs">{t("nav.logout")}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{t("nav.logout")}</TooltipContent>}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="sidebar-link sidebar-link-inactive w-full justify-center"
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                {!collapsed && <span className="text-xs">{t("nav.collapse")}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{t("nav.expand")}</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
