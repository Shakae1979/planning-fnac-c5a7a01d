import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, Users, CalendarDays, User, Store, Palmtree, Crown } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

import { CongesCalendar } from "@/components/dashboard/CongesCalendar";
import { TeamAndAccounts } from "@/components/dashboard/TeamAndAccounts";
import { StoreManager } from "@/components/dashboard/StoreManager";
import { DirectionFnac } from "@/components/dashboard/DirectionFnac";
import { ContactMessages } from "@/components/dashboard/ContactMessages";

import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type View = "overview" | "schedule" | "team" | "conges" | "stores" | "messages";

const Index = () => {
  const [view, setView] = useState<View>("overview");
  const navigate = useNavigate();
  const location = useLocation();
  const { stores, currentStore, setCurrentStore } = useStore();
  const { role } = useAuth();
  const { t } = useI18n();

  const isDirection = currentStore?.is_direction === true;

  // Separate direction store from regular stores
  const regularStores = stores.filter((s) => !s.is_direction);
  const directionStore = stores.find((s) => s.is_direction);

  const NAV_SHORTCUTS = [
    { label: t("header.teamDay"), path: "/equipe-du-jour", icon: Users },
    { label: t("header.weekPlan"), path: "/planning-equipe", icon: CalendarDays },
    { label: t("header.myPlan"), path: "/mon-planning", icon: User },
    { label: t("nav.conges"), path: "/conges", icon: Palmtree },
  ];

  const showStoreSelector = stores.length > 1 || directionStore;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between" style={{ background: "hsl(var(--sidebar-bg))" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: "hsl(var(--sidebar-active))" }} />
              <h1 className="text-base font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
                {t("header.title")}
              </h1>
            </div>

            {showStoreSelector && (
              <>
                <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
                <Select
                  value={currentStore?.id || ""}
                  onValueChange={(val) => {
                    const s = stores.find((st) => st.id === val);
                    if (s) setCurrentStore(s);
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8 text-xs border-none" style={{ background: "hsl(var(--sidebar-hover))", color: "hsl(var(--sidebar-fg))" }}>
                    {isDirection ? <Crown className="h-3.5 w-3.5 mr-1 text-amber-500" /> : <Store className="h-3.5 w-3.5 mr-1" />}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regularStores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-1.5">
                          <Store className="h-3 w-3" />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                    {directionStore && (
                      <>
                        {regularStores.length > 0 && <Separator className="my-1" />}
                        <SelectItem value={directionStore.id}>
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Crown className="h-3 w-3 text-amber-500" />
                            {directionStore.name}
                          </span>
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </>
            )}

            {!showStoreSelector && stores.length === 1 && currentStore && (
              <>
                <div className="h-5 w-px" style={{ background: "hsl(var(--sidebar-fg) / 0.2)" }} />
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: "hsl(var(--sidebar-fg))" }}>
                  <Store className="h-3.5 w-3.5" />
                  {currentStore.name}
                </span>
              </>
            )}

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
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <p className="text-xs" style={{ color: "hsl(var(--sidebar-fg) / 0.6)" }}>
              {currentStore ? currentStore.name : t("header.mgmt")}
            </p>
          </div>
        </header>

        <div className="p-6">
          {view === "overview" && (isDirection ? <DirectionFnac /> : <DashboardOverview />)}
          {view === "schedule" && <ScheduleEditor />}
          {view === "team" && <TeamAndAccounts />}
          {view === "conges" && <CongesCalendar />}
          {view === "stores" && <StoreManager />}
          {view === "messages" && <ContactMessages />}
        </div>
      </main>
    </div>
  );
};

export default Index;
