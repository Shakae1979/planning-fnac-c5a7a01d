import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = [
  { key: "lundi", label: "Lun" },
  { key: "mardi", label: "Mar" },
  { key: "mercredi", label: "Mer" },
  { key: "jeudi", label: "Jeu" },
  { key: "vendredi", label: "Ven" },
  { key: "samedi", label: "Sam" },
  { key: "dimanche", label: "Dim" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 7 * n);
  return d;
}

interface ScheduleRow {
  employee_id: string;
  employee_name: string;
  [key: string]: string | number | null | undefined;
}

export function ScheduleEditor() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatWeekDate(currentMonday);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["schedules", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const [localEdits, setLocalEdits] = useState<Record<string, Record<string, string>>>({});

  const getScheduleForEmployee = (empId: string) => {
    return schedules?.find((s) => s.employee_id === empId);
  };

  const getValue = (empId: string, field: string): string => {
    if (localEdits[empId]?.[field] !== undefined) return localEdits[empId][field];
    const schedule = getScheduleForEmployee(empId);
    if (!schedule) return "";
    return (schedule as any)[field] ?? "";
  };

  const handleChange = (empId: string, field: string, value: string) => {
    setLocalEdits((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(localEdits).map(async ([empId, fields]) => {
        const existing = getScheduleForEmployee(empId);
        const payload: any = { employee_id: empId, week_start: weekStr, ...fields };

        // Calculate hours
        let totalMinutes = 0;
        for (const day of DAYS) {
          const startField = `${day.key}_start`;
          const endField = `${day.key}_end`;
          const startVal = fields[startField] ?? (existing as any)?.[startField] ?? "";
          const endVal = fields[endField] ?? (existing as any)?.[endField] ?? "";
          if (startVal && endVal) {
            const [sh, sm] = startVal.split(":").map(Number);
            const [eh, em] = endVal.split(":").map(Number);
            if (!isNaN(sh) && !isNaN(eh)) {
              totalMinutes += (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
            }
          }
        }
        payload.hours_modified = Math.round((totalMinutes / 60) * 100) / 100;

        // Find employee contract hours
        const emp = employees?.find((e) => e.id === empId);
        payload.hours_base = emp?.contract_hours ?? 36;

        if (existing) {
          const { error } = await supabase
            .from("weekly_schedules")
            .update(payload)
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("weekly_schedules")
            .insert(payload);
          if (error) throw error;
        }
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      setLocalEdits({});
      queryClient.invalidateQueries({ queryKey: ["schedules", weekStr] });
      queryClient.invalidateQueries({ queryKey: ["all-schedules"] });
      toast.success("Horaires sauvegardés !");
    },
    onError: (err) => {
      toast.error("Erreur lors de la sauvegarde: " + (err as Error).message);
    },
  });

  const initAllMutation = useMutation({
    mutationFn: async () => {
      if (!employees) return;
      const existing = schedules?.map((s) => s.employee_id) ?? [];
      const toCreate = employees.filter((e) => !existing.includes(e.id));
      if (toCreate.length === 0) return;

      const { error } = await supabase.from("weekly_schedules").insert(
        toCreate.map((e) => ({
          employee_id: e.id,
          week_start: weekStr,
          hours_base: e.contract_hours,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", weekStr] });
      toast.success("Lignes initialisées pour toute l'équipe !");
    },
  });

  const hasEdits = Object.keys(localEdits).length > 0;

  const weekLabel = currentMonday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const endOfWeek = addWeeks(currentMonday, 1);
  endOfWeek.setDate(endOfWeek.getDate() - 2); // Saturday
  const weekEndLabel = endOfWeek.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => { setWeekOffset((w) => w - 1); setLocalEdits({}); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">{weekLabel} — {weekEndLabel}</div>
            <div className="text-xs text-muted-foreground">Semaine du {weekStr}</div>
          </div>
          <Button variant="outline" size="icon" onClick={() => { setWeekOffset((w) => w + 1); setLocalEdits({}); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => initAllMutation.mutate()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Initialiser la semaine
          </Button>
          <Button size="sm" disabled={!hasEdits || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Schedule grid */}
      <div className="kpi-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 pr-4 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[120px]">
                  Vendeur
                </th>
                {DAYS.map((day) => (
                  <th key={day.key} colSpan={2} className="pb-2 text-center font-semibold text-muted-foreground min-w-[160px]">
                    {day.label}
                  </th>
                ))}
                <th className="pb-2 text-center font-semibold text-muted-foreground min-w-[60px]">Total</th>
              </tr>
              <tr className="border-b">
                <th className="pb-1 sticky left-0 bg-card z-10"></th>
                {DAYS.map((day) => (
                  <th key={day.key + "-sub"} colSpan={2} className="pb-1 text-center">
                    <span className="text-xs text-muted-foreground">Début — Fin</span>
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : employees?.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-muted-foreground">
                    Aucun employé trouvé.
                  </td>
                </tr>
              ) : (
                employees?.map((emp) => {
                  // Calculate total hours for this row
                  let totalMinutes = 0;
                  for (const day of DAYS) {
                    const s = getValue(emp.id, `${day.key}_start`);
                    const e = getValue(emp.id, `${day.key}_end`);
                    if (s && e) {
                      const [sh, sm] = s.split(":").map(Number);
                      const [eh, em] = e.split(":").map(Number);
                      if (!isNaN(sh) && !isNaN(eh)) {
                        totalMinutes += (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
                      }
                    }
                  }
                  const totalH = Math.round((totalMinutes / 60) * 10) / 10;
                  const diff = totalH - emp.contract_hours;

                  return (
                    <tr key={emp.id} className="border-b border-border/50 table-row-hover">
                      <td className="py-1.5 pr-4 sticky left-0 bg-card z-10">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-muted-foreground font-mono-data">{emp.contract_hours}h contrat</div>
                      </td>
                      {DAYS.map((day) => (
                        <>
                          <td key={`${day.key}-s`} className="py-1.5 px-0.5">
                            <input
                              type="time"
                              value={getValue(emp.id, `${day.key}_start`)}
                              onChange={(e) => handleChange(emp.id, `${day.key}_start`, e.target.value)}
                              className="w-full px-1.5 py-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent font-mono-data"
                            />
                          </td>
                          <td key={`${day.key}-e`} className="py-1.5 px-0.5">
                            <input
                              type="time"
                              value={getValue(emp.id, `${day.key}_end`)}
                              onChange={(e) => handleChange(emp.id, `${day.key}_end`, e.target.value)}
                              className="w-full px-1.5 py-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent font-mono-data"
                            />
                          </td>
                        </>
                      ))}
                      <td className="py-1.5 text-center">
                        <span className="font-mono-data font-medium">{totalH || "—"}</span>
                        {totalH > 0 && diff !== 0 && (
                          <div className={`text-xs ${diff > 0 ? "text-warning" : "text-destructive"}`}>
                            {diff > 0 ? "+" : ""}{diff}h
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
