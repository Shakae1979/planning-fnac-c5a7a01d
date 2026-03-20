import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Printer, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
import { formatDateBE, formatLocalDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const CONGE_TYPES = [
  { value: "conge", label: "Congé payé", color: "bg-blue-400" },
  { value: "rtt", label: "RTT", color: "bg-emerald-400" },
  { value: "maladie", label: "Maladie", color: "bg-red-400" },
  { value: "formation", label: "Formation", color: "bg-purple-400" },
  { value: "autre", label: "Autre", color: "bg-muted-foreground" },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type ViewMode = "month" | "quarter";

interface MonthGridProps {
  year: number;
  month: number;
  employees: any[] | undefined;
  conges: any[] | undefined;
  deleteMutation: any;
  compact?: boolean;
}

function MonthGrid({ year, month, employees, conges, deleteMutation, compact }: MonthGridProps) {
  const daysInMonth = getDaysInMonth(year, month);

  const isOnLeave = (empId: string, dateStr: string) => {
    return conges?.find((c: any) => {
      if (c.employee_id !== empId) return false;
      return dateStr >= c.date_start && dateStr <= c.date_end;
    });
  };

  const cellSize = compact ? "min-w-[18px]" : "min-w-[28px]";
  const dotSize = compact ? "w-3.5 h-3.5" : "w-5 h-5";
  const fontSize = compact ? "text-[8px]" : "text-[9px]";

  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1 text-center">
        {MONTHS[month]}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className={`pb-0 pr-1 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 ${compact ? "min-w-[90px]" : "min-w-[120px]"}`}></th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(year, month, i + 1);
                const jsDay = d.getDay();
                const dayLetters = ["D", "L", "M", "M", "J", "V", "S"];
                const isWeekend = jsDay === 0 || jsDay === 6;
                const isMonday = jsDay === 1;
                return (
                  <th key={i} className={`pb-0 text-center ${fontSize} font-normal ${cellSize} ${isWeekend ? "text-muted-foreground/40" : "text-muted-foreground/70"} ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`}>
                    {dayLetters[jsDay]}
                  </th>
                );
              })}
              <th className={`pb-0 ${compact ? "min-w-[30px]" : "min-w-[40px]"}`}></th>
            </tr>
            <tr className="border-b">
              <th className={`pb-1 pr-1 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 ${compact ? "min-w-[90px] text-[10px]" : "min-w-[120px]"}`}>
                {compact ? "" : "Vendeur"}
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(year, month, i + 1);
                const jsDay = d.getDay();
                const isWeekend = jsDay === 0 || jsDay === 6;
                const isMonday = jsDay === 1;
                return (
                  <th key={i} className={`pb-1 text-center font-medium ${cellSize} ${compact ? "text-[9px]" : ""} ${isWeekend ? "text-muted-foreground/50" : "text-muted-foreground"} ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`}>
                    {i + 1}
                  </th>
                );
              })}
              <th className={`pb-1 text-center font-semibold text-muted-foreground ${compact ? "min-w-[30px] text-[9px]" : "min-w-[40px]"}`}>
                {compact ? "T" : "Total"}
              </th>
            </tr>
          </thead>
          <tbody>
            {employees?.map((emp) => {
              let totalDays = 0;
              return (
                <tr key={emp.id} className="border-b border-border/50">
                  <td className={`py-0.5 pr-1 sticky left-0 bg-card z-10 ${compact ? "text-[10px]" : ""}`}>
                    <div className="font-medium truncate">{emp.name}</div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dateStr = formatDate(year, month, i + 1);
                    const leave = isOnLeave(emp.id, dateStr);
                    const d = new Date(year, month, i + 1);
                    const jsDay = d.getDay();
                    const isWeekend = jsDay === 0 || jsDay === 6;
                    const isMonday = jsDay === 1;
                    if (leave) totalDays++;
                    const typeColor = leave ? CONGE_TYPES.find((t) => t.value === leave.type)?.color ?? "bg-muted" : "";
                    return (
                      <td key={i} className={`py-0.5 text-center ${isWeekend ? "bg-muted/30" : ""} ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`}>
                        {leave ? (
                          <span className={`inline-block ${dotSize} rounded ${typeColor} cursor-pointer`} title={`${CONGE_TYPES.find((t) => t.value === leave.type)?.label} — cliquer pour supprimer`} onClick={() => deleteMutation.mutate(leave.id)} />
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="py-0.5 text-center font-mono-data font-medium text-[10px]">{totalDays || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CongesCalendar() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentQuarter, setCurrentQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const year = 2026;

  const roleOrder = ["responsable", "technique", "editorial", "stock", "caisse"];

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
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

  const [showForm, setShowForm] = useState(false);
  const [formEmp, setFormEmp] = useState("");
  const [formStart, setFormStart] = useState<Date | undefined>();
  const [formEnd, setFormEnd] = useState<Date | undefined>();
  const [formType, setFormType] = useState("conge");

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!formEmp || !formStart || !formEnd) throw new Error("Tous les champs sont requis");
      const { error } = await supabase.from("conges").insert({
        employee_id: formEmp,
        date_start: formatLocalDate(formStart),
        date_end: formatLocalDate(formEnd),
        type: formType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setShowForm(false);
      setFormEmp("");
      setFormStart(undefined);
      setFormEnd(undefined);
      queryClient.invalidateQueries({ queryKey: ["conges"] });
      toast.success("Congé ajouté !");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("conges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conges"] });
      toast.success("Congé supprimé !");
    },
  });

  const quarterMonths = [currentQuarter * 3, currentQuarter * 3 + 1, currentQuarter * 3 + 2];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-2">
            {["T1", "T2", "T3", "T4"].map((label, qi) => (
              <Button
                key={label}
                variant={viewMode === "quarter" && currentQuarter === qi ? "default" : "outline"}
                size="sm"
                className="px-2.5 text-xs"
                onClick={() => {
                  setViewMode("quarter");
                  setCurrentQuarter(qi);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="w-px h-6 bg-border" />
          <Button variant="outline" size="icon" onClick={() => {
            setViewMode("month");
            setCurrentMonth((m) => Math.max(0, m - 1));
          }} disabled={viewMode === "month" && currentMonth === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            className="min-w-[140px] text-xs font-semibold"
            onClick={() => setViewMode("month")}
          >
            {MONTHS[currentMonth]} {year}
          </Button>
          <Button variant="outline" size="icon" onClick={() => {
            setViewMode("month");
            setCurrentMonth((m) => Math.min(11, m + 1));
          }} disabled={viewMode === "month" && currentMonth === 11}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            {CONGE_TYPES.map((t) => (
              <span key={t.value} className="flex items-center gap-1">
                <span className={`inline-block w-3 h-3 rounded ${t.color}`} />
                {t.label}
              </span>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="kpi-card flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Vendeur</label>
            <select value={formEmp} onChange={(e) => setFormEmp(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background">
              <option value="">Choisir…</option>
              {employees?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Début</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("mt-1 w-[150px] justify-start text-left font-normal", !formStart && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {formStart ? formatDateBE(formStart) : "Choisir…"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={formStart} onSelect={setFormStart} locale={fr} weekStartsOn={1} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fin</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("mt-1 w-[150px] justify-start text-left font-normal", !formEnd && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {formEnd ? formatDateBE(formEnd) : "Choisir…"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={formEnd} onSelect={setFormEnd} locale={fr} weekStartsOn={1} disabled={(date) => formStart ? date < formStart : false} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Type</label>
            <select value={formType} onChange={(e) => setFormType(e.target.value)} className="mt-1 px-3 py-2 text-sm rounded-md border bg-background">
              {CONGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>Valider</Button>
        </div>
      )}

      {viewMode === "month" ? (
        <div className="kpi-card overflow-hidden">
          <MonthGrid
            year={year}
            month={currentMonth}
            employees={employees}
            conges={conges}
            deleteMutation={deleteMutation}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {quarterMonths.map((m) => (
            <div key={m} className="kpi-card overflow-hidden">
              <MonthGrid
                year={year}
                month={m}
                employees={employees}
                conges={conges}
                deleteMutation={deleteMutation}
                compact
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
