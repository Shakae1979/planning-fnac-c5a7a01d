import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save, Plus, Printer, Copy, ClipboardPaste, X, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatDateLongBE, formatDateMonthBE, formatDateBE, formatTimeBE, formatLocalDate, getWeekNumber } from "@/lib/format";

/** Convert "HHhMM" or "HH:MM" or "HHMM" to "HH:MM" for storage */
function parseTimeBE(input: string): string {
  if (!input) return "";
  // Remove spaces
  const cleaned = input.trim();
  // Try HHhMM
  const hMatch = cleaned.match(/^(\d{1,2})h(\d{0,2})$/i);
  if (hMatch) {
    const h = hMatch[1].padStart(2, "0");
    const m = (hMatch[2] || "0").padStart(2, "0");
    return `${h}:${m}`;
  }
  // Try HH:MM
  const colonMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    return `${colonMatch[1].padStart(2, "0")}:${colonMatch[2]}`;
  }
  // Try HHMM (4 digits)
  const digits = cleaned.match(/^(\d{2})(\d{2})$/);
  if (digits) {
    return `${digits[1]}:${digits[2]}`;
  }
  // Try just HH
  const hourOnly = cleaned.match(/^(\d{1,2})$/);
  if (hourOnly) {
    return `${hourOnly[1].padStart(2, "0")}:00`;
  }
  return cleaned;
}

/** Convert stored "HH:MM" to display "HHhMM" */
function displayTimeBE(value: string): string {
  if (!value) return "";
  return formatTimeBE(value);
}

const DAYS = [
  { key: "lundi", label: "Lun" },
  { key: "mardi", label: "Mar" },
  { key: "mercredi", label: "Mer" },
  { key: "jeudi", label: "Jeu" },
  { key: "vendredi", label: "Ven" },
  { key: "samedi", label: "Sam" },
  { key: "dimanche", label: "Dim" },
] as const;

const DEPT_COLORS: Record<string, { bg: string; border: string }> = {
  responsable: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-l-orange-500" },
  technique: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-l-blue-500" },
  editorial: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-l-purple-500" },
  stock: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-l-amber-500" },
  caisse: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-l-emerald-500" },
};

/** Generate time slots from 07:00 to 21:00 every 30 min */
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 21) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

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
  return formatLocalDate(date);
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

// Returns the date string for a given day index (0=monday) in the week
function getDayDate(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIndex);
  return formatLocalDate(d);
}

export function ScheduleEditor() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatWeekDate(currentMonday);

  // Compute week date range for conges query
  const weekSunday = new Date(currentMonday);
  weekSunday.setDate(weekSunday.getDate() + 6);
  const weekEndStr = formatWeekDate(weekSunday);

  const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse"];

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data?.sort((a, b) => {
        const ra = ROLE_ORDER.indexOf(a.role);
        const rb = ROLE_ORDER.indexOf(b.role);
        const orderA = ra === -1 ? ROLE_ORDER.length : ra;
        const orderB = rb === -1 ? ROLE_ORDER.length : rb;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name, "fr");
      });
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

  // Fetch conges that overlap with this week
  const { data: conges } = useQuery({
    queryKey: ["conges-week", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .lte("date_start", weekEndStr)
        .gte("date_end", weekStr);
      if (error) throw error;
      return data;
    },
  });

  // Fetch day comments for this week
  const { data: dayComments } = useQuery({
    queryKey: ["day-comments", weekStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("day_comments")
        .select("*")
        .eq("week_start", weekStr);
      if (error) throw error;
      return data;
    },
  });

  const [localDayComments, setLocalDayComments] = useState<Record<string, string>>({});

  // Check if an employee is on leave for a specific day
  const isOnLeave = (empId: string, dayIndex: number): string | null => {
    if (!conges) return null;
    const dayDate = getDayDate(currentMonday, dayIndex);
    const match = conges.find(
      (c) => c.employee_id === empId && c.date_start <= dayDate && c.date_end >= dayDate
    );
    return match ? match.type : null;
  };

  const [localEdits, setLocalEdits] = useState<Record<string, Record<string, string>>>({});

  // Copy-paste state
  const [copiedEmployee, setCopiedEmployee] = useState<string | null>(null); // source employee ID
  const [copiedDay, setCopiedDay] = useState<string | null>(null); // source day key
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set()); // target employee IDs
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set()); // target day keys

  // Cell-level copy-paste
  const [copiedCell, setCopiedCell] = useState<{ empId: string; dayKey: string } | null>(null);

  const toggleTarget = (empId: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId); else next.add(empId);
      return next;
    });
  };

  const toggleDay = (dayKey: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayKey)) next.delete(dayKey); else next.add(dayKey);
      return next;
    });
  };

  const copyEmployeeSchedule = (empId: string) => {
    setCopiedEmployee(empId);
    setCopiedDay(null);
    setSelectedTargets(new Set());
    setSelectedDays(new Set());
    const empName = employees?.find((e) => e.id === empId)?.name ?? "";
    toast.info(`Horaires de ${empName} copiés — cochez les cibles puis collez`);
  };

  const copyDaySchedule = (dayKey: string) => {
    setCopiedDay(dayKey);
    setCopiedEmployee(null);
    setSelectedTargets(new Set());
    setSelectedDays(new Set());
    const dayLabel = DAYS.find((d) => d.key === dayKey)?.label ?? dayKey;
    toast.info(`${dayLabel} copié — cochez les jours cibles puis collez`);
  };

  const pasteToTargets = () => {
    if (copiedEmployee && selectedTargets.size > 0) {
      // Copy employee schedule to selected target employees
      const sourceSchedule = getScheduleForEmployee(copiedEmployee);
      const newEdits = { ...localEdits };
      selectedTargets.forEach((targetId) => {
        if (targetId === copiedEmployee) return;
        const targetEdits: Record<string, string> = {};
        for (const day of DAYS) {
          targetEdits[`${day.key}_start`] = getValue(copiedEmployee, `${day.key}_start`);
          targetEdits[`${day.key}_end`] = getValue(copiedEmployee, `${day.key}_end`);
        }
        newEdits[targetId] = { ...newEdits[targetId], ...targetEdits };
      });
      setLocalEdits(newEdits);
      toast.success(`Horaires collés sur ${selectedTargets.size} employé(s)`);
    }
    if (copiedDay && selectedDays.size > 0 && employees) {
      // Copy one day to other days for ALL employees
      const newEdits = { ...localEdits };
      employees.forEach((emp) => {
        const startVal = getValue(emp.id, `${copiedDay}_start`);
        const endVal = getValue(emp.id, `${copiedDay}_end`);
        selectedDays.forEach((targetDay) => {
          if (targetDay === copiedDay) return;
          if (!newEdits[emp.id]) newEdits[emp.id] = {};
          newEdits[emp.id][`${targetDay}_start`] = startVal;
          newEdits[emp.id][`${targetDay}_end`] = endVal;
        });
      });
      setLocalEdits(newEdits);
      const dayLabel = DAYS.find((d) => d.key === copiedDay)?.label ?? "";
      toast.success(`${dayLabel} collé sur ${selectedDays.size} jour(s)`);
    }
    cancelCopy();
  };

  const cancelCopy = () => {
    setCopiedEmployee(null);
    setCopiedDay(null);
    setSelectedTargets(new Set());
    setSelectedDays(new Set());
    setCopiedCell(null);
  };

  const copyCellSchedule = (empId: string, dayKey: string) => {
    setCopiedCell({ empId, dayKey });
    setCopiedEmployee(null);
    setCopiedDay(null);
    const empName = employees?.find((e) => e.id === empId)?.name ?? "";
    const dayLabel = DAYS.find((d) => d.key === dayKey)?.label ?? dayKey;
    toast.info(`${dayLabel} de ${empName} copié — cliquez "Coller" sur la cellule cible`);
  };

  const pasteCellSchedule = (targetEmpId: string, targetDayKey: string) => {
    if (!copiedCell) return;
    const startVal = getValue(copiedCell.empId, `${copiedCell.dayKey}_start`);
    const endVal = getValue(copiedCell.empId, `${copiedCell.dayKey}_end`);
    setLocalEdits((prev) => ({
      ...prev,
      [targetEmpId]: {
        ...prev[targetEmpId],
        [`${targetDayKey}_start`]: startVal,
        [`${targetDayKey}_end`]: endVal,
      },
    }));
    const empName = employees?.find((e) => e.id === targetEmpId)?.name ?? "";
    toast.success(`Horaires collés sur ${empName}`);
    setCopiedCell(null);
  };

  const getScheduleForEmployee = (empId: string) => {
    return schedules?.find((s) => s.employee_id === empId);
  };

  const getDisplayValue = (empId: string, field: string): string => {
    if (localEdits[empId]?.[field] !== undefined) return localEdits[empId][field];
    const schedule = getScheduleForEmployee(empId);
    if (!schedule) return "";
    return (schedule as any)[field] ?? "";
  };

  const getValue = (empId: string, field: string): string => {
    if (localEdits[empId]?.[field] !== undefined) return localEdits[empId][field];
    const schedule = getScheduleForEmployee(empId);
    if (!schedule) return "";
    return (schedule as any)[field] ?? "";
  };

  const handleTimeInput = (empId: string, field: string, displayValue: string) => {
    const stored = parseTimeBE(displayValue);
    setLocalEdits((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: stored },
    }));
  };

  const handleChange = (empId: string, field: string, value: string) => {
    setLocalEdits((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value },
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save schedules
      const promises = Object.entries(localEdits).map(async ([empId, fields]) => {
        const existing = getScheduleForEmployee(empId);
        const payload: any = { employee_id: empId, week_start: weekStr, ...fields };

        // Calculate hours
        let totalMinutes = 0;
        let workedDays = 0;
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
              workedDays++;
            }
          }
        }
        const breakMinutes = workedDays * 60;
        payload.hours_modified = Math.round(((totalMinutes - breakMinutes) / 60) * 100) / 100;

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

      // Save day comments
      const commentPromises = Object.entries(localDayComments).map(async ([dayKey, comment]) => {
        const existing = dayComments?.find((dc) => dc.day_key === dayKey);
        if (existing) {
          const { error } = await supabase
            .from("day_comments")
            .update({ comment })
            .eq("id", existing.id);
          if (error) throw error;
        } else if (comment.trim()) {
          const { error } = await supabase
            .from("day_comments")
            .insert({ week_start: weekStr, day_key: dayKey, comment });
          if (error) throw error;
        }
      });

      await Promise.all([...promises, ...commentPromises]);
    },
    onSuccess: () => {
      setLocalEdits({});
      setLocalDayComments({});
      queryClient.invalidateQueries({ queryKey: ["schedules", weekStr] });
      queryClient.invalidateQueries({ queryKey: ["all-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["day-comments", weekStr] });
      queryClient.invalidateQueries({ queryKey: ["team-week-day-comments", weekStr] });
      toast.success("Horaires sauvegardés !");
    },
    onError: (err) => {
      toast.error("Erreur lors de la sauvegarde: " + (err as Error).message);
    },
  });

  const TEMPLATE_WEEK = "1970-01-05"; // Semaine 0 = template par défaut

  const initAllMutation = useMutation({
    mutationFn: async () => {
      if (!employees) return;

      // Fetch template week (Semaine 0)
      const { data: templates } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", TEMPLATE_WEEK);

      const existingIds = schedules?.map((s) => s.employee_id) ?? [];
      const toCreate = employees.filter((e) => !existingIds.includes(e.id));
      const toUpdate = employees.filter((e) => existingIds.includes(e.id));

      // Insert new rows
      if (toCreate.length > 0) {
        const rows = toCreate.map((e) => {
          const tpl = templates?.find((t) => t.employee_id === e.id);
          if (tpl) {
            const { id, created_at, updated_at, week_start, ...fields } = tpl as any;
            return { ...fields, employee_id: e.id, week_start: weekStr, hours_base: e.contract_hours };
          }
          return { employee_id: e.id, week_start: weekStr, hours_base: e.contract_hours };
        });
        const { error } = await supabase.from("weekly_schedules").insert(rows);
        if (error) throw error;
      }

      // Update existing rows with template data
      const updatePromises = toUpdate.map(async (e) => {
        const tpl = templates?.find((t) => t.employee_id === e.id);
        if (!tpl) return; // no template for this employee, skip
        const existingSchedule = schedules?.find((s) => s.employee_id === e.id);
        if (!existingSchedule) return;
        const { id, created_at, updated_at, week_start, employee_id, ...fields } = tpl as any;
        const { error } = await supabase
          .from("weekly_schedules")
          .update({ ...fields, hours_base: e.contract_hours })
          .eq("id", existingSchedule.id);
        if (error) throw error;
      });
      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", weekStr] });
      toast.success("Semaine initialisée depuis la Semaine 0 !");
    },
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!employees || !schedules) return;

      // Delete existing template rows
      await supabase.from("weekly_schedules").delete().eq("week_start", TEMPLATE_WEEK);

      // Copy current week as template
      const rows = schedules.map((s) => {
        const { id, created_at, updated_at, week_start, ...fields } = s as any;
        return { ...fields, week_start: TEMPLATE_WEEK };
      });

      if (rows.length > 0) {
        const { error } = await supabase.from("weekly_schedules").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Semaine 0 (template) mise à jour !");
    },
    onError: (err) => {
      toast.error("Erreur: " + (err as Error).message);
    },
  });

  const hasEdits = Object.keys(localEdits).length > 0 || Object.keys(localDayComments).length > 0;

  const weekLabel = formatDateLongBE(currentMonday);

  const endOfWeek = addWeeks(currentMonday, 1);
  endOfWeek.setDate(endOfWeek.getDate() - 2); // Saturday
  const weekEndLabel = formatDateMonthBE(endOfWeek);

  const isCopyMode = copiedEmployee !== null || copiedDay !== null;
  const isCellCopyMode = copiedCell !== null;

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => { setWeekOffset((w) => w - 1); setLocalEdits({}); setLocalDayComments({}); cancelCopy(); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">S{getWeekNumber(currentMonday)} — {weekLabel} — {weekEndLabel}</div>
            <div className="text-xs text-muted-foreground">Semaine du {formatDateBE(currentMonday)}</div>
          </div>
          <Button variant="outline" size="icon" onClick={() => { setWeekOffset((w) => w + 1); setLocalEdits({}); setLocalDayComments({}); cancelCopy(); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={() => saveAsTemplateMutation.mutate()} disabled={!schedules?.length}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Sauver comme Sem. 0
          </Button>
          <Button variant="outline" size="sm" onClick={() => initAllMutation.mutate()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Initialiser depuis Sem. 0
          </Button>
          <Button size="sm" disabled={!hasEdits || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Copy-paste toolbar */}
      {isCopyMode && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-accent bg-accent/10">
          <ClipboardPaste className="h-4 w-4 text-accent-foreground" />
          <span className="text-sm font-medium">
            {copiedEmployee && `Horaires de ${employees?.find((e) => e.id === copiedEmployee)?.name} copiés`}
            {copiedDay && `${DAYS.find((d) => d.key === copiedDay)?.label} copié`}
            {" — "}
            {copiedEmployee && `Cochez les employés cibles (${selectedTargets.size} sélectionné(s))`}
            {copiedDay && `Cochez les jours cibles (${selectedDays.size} sélectionné(s))`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={pasteToTargets}
              disabled={(copiedEmployee && selectedTargets.size === 0) || (copiedDay && selectedDays.size === 0) ? true : false}
            >
              <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> Coller
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelCopy}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Schedule grid */}
      <div className="kpi-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 pr-4 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]">
                  Vendeur
                </th>
                {DAYS.map((day) => (
                  <th key={day.key} colSpan={2} className="pb-2 text-center font-semibold text-muted-foreground min-w-[160px]">
                    <div className="flex items-center justify-center gap-1">
                      {copiedDay !== null && copiedDay !== day.key && (
                        <Checkbox
                          checked={selectedDays.has(day.key)}
                          onCheckedChange={() => toggleDay(day.key)}
                          className="mr-1"
                        />
                      )}
                      <span>{day.label}</span>
                      {!isCopyMode && (
                        <button
                          onClick={() => copyDaySchedule(day.key)}
                          className="ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title={`Copier ${day.label}`}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                      {copiedDay === day.key && (
                        <span className="ml-1 text-xs text-primary font-normal">(source)</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="pb-2 text-center font-semibold text-muted-foreground min-w-[60px]">Total</th>
              </tr>
              {/* Day comments row */}
              <tr className="border-b bg-muted/30">
                <td className="py-1 pr-2 sticky left-0 bg-muted/30 z-10">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>Notes</span>
                  </div>
                </td>
                {DAYS.map((day) => {
                  const savedComment = dayComments?.find((dc) => dc.day_key === day.key)?.comment ?? "";
                  const value = localDayComments[day.key] ?? savedComment;
                  return (
                    <td key={day.key + "-comment"} colSpan={2} className="py-1 px-0.5">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setLocalDayComments((prev) => ({ ...prev, [day.key]: e.target.value }))}
                        placeholder="—"
                        className="w-full px-1.5 py-0.5 text-xs text-center rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </td>
                  );
                })}
                <td></td>
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
                  let workedDays = 0;
                  for (const day of DAYS) {
                    const s = getValue(emp.id, `${day.key}_start`);
                    const e = getValue(emp.id, `${day.key}_end`);
                    if (s && e) {
                      const [sh, sm] = s.split(":").map(Number);
                      const [eh, em] = e.split(":").map(Number);
                      if (!isNaN(sh) && !isNaN(eh)) {
                        totalMinutes += (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
                        workedDays++;
                      }
                    }
                  }
                  const breakMinutes = workedDays * 60; // 1h de pause par jour travaillé
                  const totalH = Math.round(((totalMinutes - breakMinutes) / 60) * 10) / 10;
                  const diff = totalH - emp.contract_hours;

                  const deptColor = DEPT_COLORS[emp.role] ?? { bg: "", border: "border-l-muted" };
                  // Count leave days for this employee this week
                  let leaveDays = 0;
                  for (let di = 0; di < DAYS.length; di++) {
                    if (isOnLeave(emp.id, di)) leaveDays++;
                  }
                  const isUnderstaffed = leaveDays === 0 && totalH > 0 && totalH < emp.contract_hours;
                  const isSource = copiedEmployee === emp.id;

                  return (
                    <tr key={emp.id} className={`border-b border-border/50 border-l-4 ${deptColor.border} ${isUnderstaffed ? "bg-destructive/10" : isSource ? "bg-primary/10" : deptColor.bg}`}>
                      <td className={`py-1.5 pr-2 sticky left-0 z-10 ${isUnderstaffed ? "bg-destructive/10" : isSource ? "bg-primary/10" : deptColor.bg}`}>
                        <div className="flex items-center gap-2">
                          {copiedEmployee !== null && !isSource && (
                            <Checkbox
                              checked={selectedTargets.has(emp.id)}
                              onCheckedChange={() => toggleTarget(emp.id)}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium flex items-center gap-1">
                              {emp.name}
                              {!isCopyMode && (
                                <button
                                  onClick={() => copyEmployeeSchedule(emp.id)}
                                  className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title={`Copier les horaires de ${emp.name}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                              {isSource && <span className="text-xs text-primary">(source)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono-data">{emp.contract_hours}h contrat</div>
                          </div>
                        </div>
                      </td>
                      {DAYS.map((day, dayIndex) => {
                        const leaveType = isOnLeave(emp.id, dayIndex);
                        if (leaveType) {
                          const leaveLabels: Record<string, string> = {
                            conge: "CP", rtt: "RTT", maladie: "MAL", formation: "FORM",
                          };
                          return (
                            <td key={`${day.key}-leave`} colSpan={2} className="py-1.5 px-0.5 text-center">
                              <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                {leaveLabels[leaveType] ?? leaveType.toUpperCase()}
                              </span>
                            </td>
                          );
                        }
                        const hasValue = !!(getValue(emp.id, `${day.key}_start`) || getValue(emp.id, `${day.key}_end`));
                        const isCellSource = copiedCell?.empId === emp.id && copiedCell?.dayKey === day.key;
                        const showPaste = isCellCopyMode && !isCellSource;
                        return (
                          <td key={`${day.key}-cell`} colSpan={2} className={`py-1.5 px-0.5 ${isCellSource ? "bg-primary/10" : ""}`}>
                            <div className="flex items-center gap-0.5">
                              <select
                                value={getDisplayValue(emp.id, `${day.key}_start`)}
                                onChange={(e) => handleChange(emp.id, `${day.key}_start`, e.target.value)}
                                className="flex-1 min-w-0 px-0.5 py-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent font-mono-data text-center appearance-none cursor-pointer"
                              >
                                <option value="">—</option>
                                <option value="EXT">Extérieur</option>
                                {TIME_SLOTS.map((t) => (
                                  <option key={t} value={t}>{displayTimeBE(t)}</option>
                                ))}
                              </select>
                              <select
                                value={getDisplayValue(emp.id, `${day.key}_end`)}
                                onChange={(e) => handleChange(emp.id, `${day.key}_end`, e.target.value)}
                                className="flex-1 min-w-0 px-0.5 py-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent font-mono-data text-center appearance-none cursor-pointer"
                              >
                                <option value="">—</option>
                                <option value="EXT">Extérieur</option>
                                {TIME_SLOTS.map((t) => (
                                  <option key={t} value={t}>{displayTimeBE(t)}</option>
                                ))}
                              </select>
                              {/* Cell copy/paste buttons */}
                              {!isCopyMode && !isCellCopyMode && hasValue && (
                                <button
                                  onClick={() => copyCellSchedule(emp.id, day.key)}
                                  className="p-0.5 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                                  title="Copier ce créneau"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                              {showPaste && (
                                <button
                                  onClick={() => pasteCellSchedule(emp.id, day.key)}
                                  className="p-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors shrink-0"
                                  title="Coller ici"
                                >
                                  <ClipboardPaste className="h-3 w-3" />
                                </button>
                              )}
                              {isCellSource && (
                                <button
                                  onClick={cancelCopy}
                                  className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                  title="Annuler"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
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
