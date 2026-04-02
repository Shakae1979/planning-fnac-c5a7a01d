import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { FnacHeader } from "@/components/FnacHeader";
import { CONGE_TYPES_KEYS, CONGE_TYPE_COLORS } from "@/components/dashboard/CongesCalendar";
import { QuarterView } from "@/components/dashboard/conges/QuarterView";
import { MonthGrid } from "@/components/dashboard/conges/MonthGrid";

type ViewMode = "month" | "quarter";

const roleOrder = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];

export default function CongesView() {
  const { t, monthName } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentQuarter, setCurrentQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const year = new Date().getFullYear();

  const congeTypes = CONGE_TYPES_KEYS.map((k) => ({
    value: k,
    label: t(`leave.${k}` as any),
    color: CONGE_TYPE_COLORS[k],
  }));

  const { currentStore } = useStore();
  const { data: employees } = useQuery({
    queryKey: ["employees", currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data.sort((a, b) => {
        const ra = roleOrder.indexOf(a.role);
        const rb = roleOrder.indexOf(b.role);
        if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
        return a.name.localeCompare(b.name);
      });
    },
  });

  const { data: conges } = useQuery({
    queryKey: ["conges", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .gte("date_start", `${year}-01-01`)
        .lte("date_end", `${year}-12-31`);
      if (error) throw error;
      return data;
    },
  });

  const quarterMonths = [currentQuarter * 3, currentQuarter * 3 + 1, currentQuarter * 3 + 2];

  return (
    <div className="min-h-screen bg-background">
      <FnacHeader title={t("nav.conges")} subtitle="Consultation" />
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 mr-2">
              {["T1", "T2", "T3", "T4"].map((label, qi) => (
                <Button
                  key={label}
                  variant={viewMode === "quarter" && currentQuarter === qi ? "default" : "outline"}
                  size="sm"
                  className="px-2.5 text-xs"
                  onClick={() => { setViewMode("quarter"); setCurrentQuarter(qi); }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="w-px h-6 bg-border" />
            <Button variant="outline" size="icon" onClick={() => { setViewMode("month"); setCurrentMonth((m) => Math.max(0, m - 1)); }} disabled={viewMode === "month" && currentMonth === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              className="min-w-[140px] text-xs font-semibold"
              onClick={() => setViewMode("month")}
            >
              {monthName(currentMonth)} {year}
            </Button>
            <Button variant="outline" size="icon" onClick={() => { setViewMode("month"); setCurrentMonth((m) => Math.min(11, m + 1)); }} disabled={viewMode === "month" && currentMonth === 11}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              {congeTypes.map((ct) => (
                <span key={ct.value} className="flex items-center gap-1">
                  <span className={`inline-block w-3 h-3 rounded ${ct.color}`} />
                  {ct.label}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-amber-400/40" />
                {t("leave.school.fr")}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-sky-300/30" />
                {t("leave.school.nl")}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1" /> {t("action.print")}
            </Button>
          </div>
        </div>

        {viewMode === "month" ? (
          <div className="kpi-card overflow-hidden">
            <MonthGrid year={year} month={currentMonth} employees={employees} conges={conges} readOnly />
          </div>
        ) : (
          <QuarterView year={year} months={quarterMonths} employees={employees} conges={conges} readOnly />
        )}
      </div>
    </div>
  );
}
