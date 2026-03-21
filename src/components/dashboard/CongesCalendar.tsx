import { useState, useMemo } from "react";
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
import { QuarterView } from "./conges/QuarterView";
import { MonthGrid } from "./conges/MonthGrid";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export const CONGE_TYPES = [
  { value: "conge", label: "Congé payé", color: "bg-blue-400" },
  { value: "rtt", label: "Sans solde", color: "bg-emerald-400" },
  { value: "maladie", label: "Maladie", color: "bg-red-400" },
  { value: "formation", label: "Formation", color: "bg-purple-400" },
  { value: "autre", label: "Pas encodé", color: "bg-muted-foreground" },
];

type ViewMode = "month" | "quarter";

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
        <QuarterView
          year={year}
          months={quarterMonths}
          employees={employees}
          conges={conges}
          deleteMutation={deleteMutation}
        />
      )}
    </div>
  );
}
