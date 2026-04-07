import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Save, Plus, Printer, Copy, ClipboardPaste, X, MessageSquare, Flag, History, MapPin } from "lucide-react";
import { useStoreEmployees } from "@/hooks/useStoreEmployees";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatDateLongBE, formatDateMonthBE, formatDateBE, formatTimeBE, formatLocalDate, getWeekNumber, getDisplayName } from "@/lib/format";
import { useStoreSettings } from "@/hooks/useStoreSettings";

/** Convert "HHhMM" or "HH:MM" or "HHMM" to "HH:MM" for storage */
function parseTimeBE(input: string): string {
  if (!input) return "";
  const cleaned = input.trim();
  const hMatch = cleaned.match(/^(\d{1,2})h(\d{0,2})$/i);
  if (hMatch) {
    const h = hMatch[1].padStart(2, "0");
    const m = (hMatch[2] || "0").padStart(2, "0");
    return `${h}:${m}`;
  }
  const colonMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    return `${colonMatch[1].padStart(2, "0")}:${colonMatch[2]}`;
  }
  const digits = cleaned.match(/^(\d{2})(\d{2})$/);
  if (digits) {
    return `${digits[1]}:${digits[2]}`;
  }
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

const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

const DEPT_COLORS: Record<string, { bg: string; border: string }> = {
  responsable: { bg: "bg-red-100 dark:bg-red-950/40", border: "border-l-red-500" },
  technique: { bg: "bg-orange-100 dark:bg-orange-950/40", border: "border-l-orange-500" },
  editorial: { bg: "bg-yellow-100 dark:bg-yellow-950/40", border: "border-l-yellow-500" },
  stock: { bg: "bg-blue-100 dark:bg-blue-950/40", border: "border-l-blue-500" },
  caisse: { bg: "bg-emerald-100 dark:bg-emerald-950/40", border: "border-l-emerald-500" },
  stagiaire: { bg: "bg-pink-100 dark:bg-pink-950/40", border: "border-l-pink-500" },
};
type DayKey = (typeof DAY_KEYS)[number];

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

function getDayDate(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIndex);
  return formatLocalDate(d);
}

export function ScheduleEditor() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [weekOffset, setWeekOffset] = useState(0);
  const currentMonday = addWeeks(getMonday(new Date()), weekOffset);
  const weekStr = formatWeekDate(currentMonday);

  const weekSunday = new Date(currentMonday);
  weekSunday.setDate(weekSunday.getDate() + 6);
  const weekEndStr = formatWeekDate(weekSunday);

  const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];

  const DAYS = DAY_KEYS.map((key) => ({
    key,
    label: t(`day.short.${key}` as any),
  }));

  const { currentStore } = useStore();
  const { scheduleStart, scheduleEnd } = useStoreSettings();
  const isDirection = currentStore?.is_direction === true;

  const TIME_SLOTS = useMemo(() => {
    const slots: string[] = [];
    for (let h = scheduleStart; h <= scheduleEnd; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      if (h < scheduleEnd) slots.push(`${String(h).padStart(2, "0")}:30`);
    }
    return slots;
  }, [scheduleStart, scheduleEnd]);

  // Fetch all non-direction stores for location options in direction mode
  const { data: allStores } = useQuery({
    queryKey: ["all-stores-for-direction"],
    enabled: isDirection,
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("id, name, city").eq("is_direction", false).order("name");
      if (error) throw error;
      return data;
    },
  });

  const locationOptions = useMemo(() => {
    if (!allStores) return [];
    const options = allStores.map((s) => ({ value: s.name, label: `${s.name} (${s.city})` }));
    options.push({ value: "Centrale", label: "Centrale" });
    options.push({ value: "EXT", label: t("schedule.exterior") });
    options.push({ value: "REPOS", label: t("schedule.off" as any) || "Repos" });
    return options;
  }, [allStores, t]);

  // Direction: use useStoreEmployees to get matched employees
  const { employees: directionEmployees } = useStoreEmployees(ROLE_ORDER);

  const { data: regularEmployees } = useQuery({
    queryKey: ["employees", currentStore?.id],
    enabled: !!currentStore && !isDirection,
    queryFn: async () => {
      let query = supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
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

  const employees = isDirection ? directionEmployees : regularEmployees;

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

  const { data: templatesA } = useQuery({
    queryKey: ["templates-a"],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("week_start", "1970-01-05");
      if (error) throw error;
      return data;
    },
  });
  const { data: templatesB } = useQuery({
    queryKey: ["templates-b"],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_schedules").select("*").eq("week_start", "1970-01-12");
      if (error) throw error;
      return data;
    },
  });

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

  const { data: dayComments } = useQuery({
    queryKey: ["day-comments", weekStr, currentStore?.id],
    queryFn: async () => {
      let query = supabase
        .from("day_comments")
        .select("*")
        .eq("week_start", weekStr);
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const [localDayComments, setLocalDayComments] = useState<Record<string, string>>({});
  const [localFerieDays, setLocalFerieDays] = useState<Record<string, boolean>>({});

  const isDayFerie = (dayKey: string): boolean => {
    if (localFerieDays[dayKey] !== undefined) return localFerieDays[dayKey];
    return dayComments?.find((dc) => dc.day_key === dayKey)?.is_ferie ?? false;
  };

  const isOnLeave = (empId: string, dayIndex: number): string | null => {
    if (!conges) return null;
    const dayDate = getDayDate(currentMonday, dayIndex);
    const match = conges.find(
      (c) => c.employee_id === empId && c.date_start <= dayDate && c.date_end >= dayDate
    );
    return match ? match.type : null;
  };

  const [localEdits, setLocalEdits] = useState<Record<string, Record<string, string>>>({});

  const [copiedEmployee, setCopiedEmployee] = useState<string | null>(null);
  const [copiedDay, setCopiedDay] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
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
    const empName = employees?.find((e) => e.id === empId) ? getDisplayName(employees.find((e) => e.id === empId)!) : "";
    toast.info(`${empName} ${t("copy.copied")} — ${t("copy.checkTargets")}`);
  };

  const copyDaySchedule = (dayKey: string) => {
    setCopiedDay(dayKey);
    setCopiedEmployee(null);
    setSelectedTargets(new Set());
    setSelectedDays(new Set());
    const dayLabel = DAYS.find((d) => d.key === dayKey)?.label ?? dayKey;
    toast.info(`${dayLabel} ${t("copy.copied")} — ${t("copy.checkDays")}`);
  };

  const pasteToTargets = () => {
    if (copiedEmployee && selectedTargets.size > 0) {
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
      toast.success(`${t("schedule.pastedOnEmployees")} ${selectedTargets.size} ${t("copy.employees")}`);
    }
    if (copiedDay && selectedDays.size > 0 && employees) {
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
      toast.success(`${dayLabel} ${t("copy.pastedOn")} ${selectedDays.size} ${t("copy.day")}`);
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

  const setDayFerie = (dayKey: string) => {
    const current = isDayFerie(dayKey);
    setLocalFerieDays((prev) => ({ ...prev, [dayKey]: !current }));
    const dayLabel = DAYS.find((d) => d.key === dayKey)?.label ?? dayKey;
    toast.info(`${dayLabel} ${!current ? t("schedule.markHoliday") : t("schedule.unmarkHoliday")}`);
  };

  const copyCellSchedule = (empId: string, dayKey: string) => {
    setCopiedCell({ empId, dayKey });
    setCopiedEmployee(null);
    setCopiedDay(null);
    const empName = employees?.find((e) => e.id === empId)?.name ?? "";
    const dayLabel = DAYS.find((d) => d.key === dayKey)?.label ?? dayKey;
    toast.info(`${dayLabel} ${empName} ${t("copy.copied")}`);
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
    toast.success(`${t("copy.pastedTo")} ${empName}`);
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
      const promises = Object.entries(localEdits).map(async ([empId, fields]) => {
        const existing = getScheduleForEmployee(empId);
        const payload: any = { employee_id: empId, week_start: weekStr, ...fields };

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

      // Merge localDayComments and localFerieDays into a single set of day_comments upserts
      const allDayKeys = new Set([...Object.keys(localDayComments), ...Object.keys(localFerieDays)]);
      const commentPromises = Array.from(allDayKeys).map(async (dayKey) => {
        const existing = dayComments?.find((dc) => dc.day_key === dayKey);
        const commentVal = localDayComments[dayKey] ?? existing?.comment ?? "";
        const ferieVal = localFerieDays[dayKey] ?? existing?.is_ferie ?? false;
        if (existing) {
          const { error } = await supabase
            .from("day_comments")
            .update({ comment: commentVal, is_ferie: ferieVal })
            .eq("id", existing.id);
          if (error) throw error;
        } else if (commentVal.trim() || ferieVal) {
          const { error } = await supabase
            .from("day_comments")
            .insert({ week_start: weekStr, day_key: dayKey, comment: commentVal, is_ferie: ferieVal, store_id: currentStore?.id || null });
          if (error) throw error;
        }
      });

      await Promise.all([...promises, ...commentPromises]);
    },
    onSuccess: () => {
      setLocalEdits({});
      setLocalDayComments({});
      setLocalFerieDays({});
      queryClient.invalidateQueries({ queryKey: ["schedules", weekStr] });
      queryClient.invalidateQueries({ queryKey: ["all-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["day-comments", weekStr] });
      queryClient.invalidateQueries({ queryKey: ["team-week-day-comments", weekStr] });
      toast.success(t("schedule.saved"));
    },
    onError: (err) => {
      toast.error(t("schedule.errorSaving") + ": " + (err as Error).message);
    },
  });

  const TEMPLATE_WEEK = "1970-01-05";
  const TEMPLATE_WEEK_B = "1970-01-12";
  const hasABWeeks = currentStore?.has_ab_weeks ?? false;

  const initAllMutation = useMutation({
    mutationFn: async (templateWeek?: string) => {
      const tplWeek = templateWeek || TEMPLATE_WEEK;
      if (!employees) return;
      const { data: templates } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", tplWeek);

      const existingIds = schedules?.map((s) => s.employee_id) ?? [];
      const toCreate = employees.filter((e) => !existingIds.includes(e.id));
      const toUpdate = employees.filter((e) => existingIds.includes(e.id));

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

      const updatePromises = toUpdate.map(async (e) => {
        const tpl = templates?.find((t) => t.employee_id === e.id);
        if (!tpl) return;
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
      return tplWeek;
    },
    onSuccess: (tplWeek) => {
      queryClient.invalidateQueries({ queryKey: ["schedules", weekStr] });
      if (tplWeek === TEMPLATE_WEEK_B) {
        toast.success(t("schedule.templateBApplied" as any));
      } else if (hasABWeeks) {
        toast.success(t("schedule.templateAApplied" as any));
      } else {
        toast.success(t("schedule.templateApplied"));
      }
    },
  });

  const copyPreviousWeekMutation = useMutation({
    mutationFn: async () => {
      if (!employees) return;
      const previousMonday = addWeeks(currentMonday, -1);
      const previousWeekStr = formatWeekDate(previousMonday);

      const { data: prevSchedules, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", previousWeekStr);
      if (error) throw error;
      if (!prevSchedules || prevSchedules.length === 0) {
        toast.warning(t("schedule.noPrevWeek"));
        return;
      }

      const newEdits = { ...localEdits };
      const dayFields = DAYS.flatMap((d) => [`${d.key}_start`, `${d.key}_end`]);

      prevSchedules.forEach((prev) => {
        const emp = employees.find((e) => e.id === prev.employee_id);
        if (!emp) return;
        const edits: Record<string, string> = {};
        dayFields.forEach((field) => {
          edits[field] = (prev as any)[field] ?? "";
        });
        newEdits[prev.employee_id] = { ...newEdits[prev.employee_id], ...edits };
      });

      setLocalEdits(newEdits);
    },
    onSuccess: () => {
      toast.success(t("schedule.prevWeekCopied"));
    },
    onError: (err) => {
      toast.error("Error: " + (err as Error).message);
    },
  });

  const copyPreviousWeekForEmployee = async (empId: string) => {
    try {
      const previousMonday = addWeeks(currentMonday, -1);
      const previousWeekStr = formatWeekDate(previousMonday);

      const { data: prevSchedules, error } = await supabase
        .from("weekly_schedules")
        .select("*")
        .eq("week_start", previousWeekStr)
        .eq("employee_id", empId)
        .maybeSingle();

      if (error) throw error;
      if (!prevSchedules) {
        toast.warning(t("schedule.noPrevWeek"));
        return;
      }

      const dayFields = DAYS.flatMap((d) => [`${d.key}_start`, `${d.key}_end`]);
      const edits: Record<string, string> = {};
      dayFields.forEach((field) => {
        edits[field] = (prevSchedules as any)[field] ?? "";
      });

      setLocalEdits((prev) => ({
        ...prev,
        [empId]: { ...prev[empId], ...edits },
      }));

      const empName = employees?.find((e) => e.id === empId)?.name ?? "";
      toast.success(`${t("schedule.prevWeekCopiedFor")} ${empName}`);
    } catch (err) {
      toast.error("Error: " + (err as Error).message);
    }
  };

  const saveAsTemplateMutation = useMutation({
    mutationFn: async (templateWeek?: string) => {
      const tplWeek = templateWeek || TEMPLATE_WEEK;
      if (!employees || !schedules) return;
      await supabase.from("weekly_schedules").delete().eq("week_start", tplWeek);
      const rows = schedules.map((s) => {
        const { id, created_at, updated_at, week_start, ...fields } = s as any;
        return { ...fields, week_start: tplWeek };
      });
      if (rows.length > 0) {
        const { error } = await supabase.from("weekly_schedules").insert(rows);
        if (error) throw error;
      }
      return tplWeek;
    },
    onSuccess: (tplWeek) => {
      if (tplWeek === TEMPLATE_WEEK_B) {
        toast.success(t("schedule.templateBSaved" as any));
      } else if (hasABWeeks) {
        toast.success(t("schedule.templateASaved" as any));
      } else {
        toast.success(t("schedule.templateSaved"));
      }
    },
    onError: (err) => {
      toast.error("Error: " + (err as Error).message);
    },
  });

  // Detect which template matches current week
  const detectedTemplate = useMemo(() => {
    if (!hasABWeeks || !schedules || schedules.length === 0) return null;
    const dayFields = DAY_KEYS.flatMap((d) => [`${d}_start`, `${d}_end`]);

    const matchScore = (templates: any[] | undefined) => {
      if (!templates || templates.length === 0) return 0;
      let matched = 0;
      let total = 0;
      for (const sched of schedules) {
        const tpl = templates.find((t: any) => t.employee_id === sched.employee_id);
        if (!tpl) continue;
        for (const f of dayFields) {
          const sv = (sched as any)[f] || "";
          const tv = (tpl as any)[f] || "";
          if (sv || tv) { total++; if (sv === tv) matched++; }
        }
      }
      return total > 0 ? matched / total : 0;
    };

    const scoreA = matchScore(templatesA);
    const scoreB = matchScore(templatesB);
    if (scoreA > 0.8 && scoreA > scoreB) return "A";
    if (scoreB > 0.8 && scoreB > scoreA) return "B";
    return null;
  }, [hasABWeeks, schedules, templatesA, templatesB]);

  const hasEdits = Object.keys(localEdits).length > 0 || Object.keys(localDayComments).length > 0;

  const weekLabel = formatDateLongBE(currentMonday);

  const endOfWeek = addWeeks(currentMonday, 1);
  endOfWeek.setDate(endOfWeek.getDate() - 2);
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
            <div className="text-sm font-semibold flex items-center justify-center gap-2">
              S{getWeekNumber(currentMonday)} — {weekLabel} — {weekEndLabel}
              {hasABWeeks && detectedTemplate && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  detectedTemplate === "A" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                }`}>
                  {t("schedule.week" as any)} {detectedTemplate}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{t("schedule.weekOfDate")} {formatDateBE(currentMonday)}</div>
          </div>
          <Button variant="outline" size="icon" onClick={() => { setWeekOffset((w) => w + 1); setLocalEdits({}); setLocalDayComments({}); cancelCopy(); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1" /> {t("action.print")}
          </Button>
          {hasABWeeks ? (
            <>
              <Button variant="outline" size="sm" onClick={() => saveAsTemplateMutation.mutate(TEMPLATE_WEEK)} disabled={!schedules?.length}>
                <Copy className="h-3.5 w-3.5 mr-1" /> {t("schedule.saveTemplateA" as any)}
              </Button>
              <Button variant="outline" size="sm" onClick={() => saveAsTemplateMutation.mutate(TEMPLATE_WEEK_B)} disabled={!schedules?.length}>
                <Copy className="h-3.5 w-3.5 mr-1" /> {t("schedule.saveTemplateB" as any)}
              </Button>
              <Button variant="outline" size="sm" onClick={() => initAllMutation.mutate(TEMPLATE_WEEK)}>
                <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> {t("schedule.applyTemplateA" as any)}
              </Button>
              <Button variant="outline" size="sm" onClick={() => initAllMutation.mutate(TEMPLATE_WEEK_B)}>
                <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> {t("schedule.applyTemplateB" as any)}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => saveAsTemplateMutation.mutate(TEMPLATE_WEEK)} disabled={!schedules?.length}>
                <Copy className="h-3.5 w-3.5 mr-1" /> {t("schedule.saveTemplate")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => initAllMutation.mutate(TEMPLATE_WEEK)}>
                <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> {t("schedule.applyTemplate")}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => copyPreviousWeekMutation.mutate()}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {t("schedule.copyPrevWeek")}
          </Button>
          <Button size="sm" disabled={!hasEdits || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {saveMutation.isPending ? t("action.saving") : t("action.save")}
          </Button>
        </div>
      </div>

      {/* Copy-paste toolbar */}
      {isCopyMode && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-accent bg-accent/10">
          <ClipboardPaste className="h-4 w-4 text-accent-foreground" />
          <span className="text-sm font-medium">
            {copiedEmployee && `${employees?.find((e) => e.id === copiedEmployee)?.name} ${t("copy.copied")}`}
            {copiedDay && `${DAYS.find((d) => d.key === copiedDay)?.label} ${t("copy.copied")}`}
            {" — "}
            {copiedEmployee && `${t("copy.checkTargets")} (${selectedTargets.size} ${t("copy.selected")})`}
            {copiedDay && `${t("copy.checkDays")} (${selectedDays.size} ${t("copy.selected")})`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={pasteToTargets}
              disabled={(copiedEmployee && selectedTargets.size === 0) || (copiedDay && selectedDays.size === 0) ? true : false}
            >
              <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> {t("action.paste")}
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
                  {t("schedule.seller")}
                </th>
                {DAYS.map((day) => {
                  const ferie = isDayFerie(day.key);
                  return (
                  <th key={day.key} colSpan={2} className={`pb-2 text-center font-semibold min-w-[160px] ${ferie ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" : "text-muted-foreground"}`}>
                    <div className="flex items-center justify-center gap-1">
                      {copiedDay !== null && copiedDay !== day.key && (
                        <Checkbox
                          checked={selectedDays.has(day.key)}
                          onCheckedChange={() => toggleDay(day.key)}
                          className="mr-1"
                        />
                      )}
                      <span>{day.label} {(() => { const d = new Date(currentMonday); d.setDate(d.getDate() + DAY_KEYS.indexOf(day.key as any)); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })()}</span>
                      {!isCopyMode && (
                        <>
                          <button
                            onClick={() => copyDaySchedule(day.key)}
                            className="ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={`${t("action.copy")} ${day.label}`}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setDayFerie(day.key)}
                            className={`p-0.5 rounded transition-colors ${ferie ? "bg-destructive/20 text-destructive" : "hover:bg-destructive/20 text-muted-foreground hover:text-destructive"}`}
                            title={`${t("schedule.holiday")} ${day.label}`}
                          >
                            <Flag className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      {copiedDay === day.key && (
                        <span className="ml-1 text-xs text-primary font-normal">{t("copy.source")}</span>
                      )}
                    </div>
                    {ferie && (
                      <div className="mt-1 text-[9px] font-bold uppercase tracking-wider">
                        <Flag className="h-2.5 w-2.5 inline mr-0.5" />
                        {t("schedule.holiday")}
                      </div>
                    )}
                  </th>
                  );
                })}
                <th className="pb-2 text-center font-semibold text-muted-foreground min-w-[60px]">{t("schedule.total")}</th>
              </tr>
              {/* Day comments row */}
              <tr className="border-b bg-muted/30">
                <td className="py-1 pr-2 sticky left-0 bg-muted/30 z-10">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>{t("schedule.notes")}</span>
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
                        className={`w-full px-1.5 py-0.5 text-xs text-center rounded border focus:outline-none focus:ring-1 focus:ring-accent ${
                          value.trim() ? "bg-warning/15 text-warning font-semibold border-warning/30" : "bg-background"
                        }`}
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
                    <span className="text-xs text-muted-foreground">{t("schedule.startEnd")}</span>
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                   <td colSpan={16} className="py-8 text-center text-muted-foreground">
                    {t("schedule.loading")}
                  </td>
                </tr>
              ) : employees?.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-muted-foreground">
                    {t("schedule.noEmployee")}
                  </td>
                </tr>
              ) : (
                employees?.map((emp) => {
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
                  const breakMinutes = workedDays * 60;
                  const totalH = Math.round(((totalMinutes - breakMinutes) / 60) * 10) / 10;
                  const diff = totalH - emp.contract_hours;

                  const deptColor = DEPT_COLORS[emp.role] ?? { bg: "", border: "border-l-muted" };
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
                                  onClick={() => copyPreviousWeekForEmployee(emp.id)}
                                  className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title={`${t("schedule.copyPrevWeek")} ${emp.name}`}
                                >
                                  <History className="h-3 w-3" />
                                </button>
                              )}
                              {isSource && <span className="text-xs text-primary">{t("copy.source")}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono-data">{emp.contract_hours}h {t("schedule.contract")}</div>
                          </div>
                        </div>
                      </td>
                      {DAYS.map((day, dayIndex) => {
                        const leaveType = isOnLeave(emp.id, dayIndex);
                        const ferieDay = isDayFerie(day.key);
                        if (leaveType) {
                          return (
                            <td key={`${day.key}-leave`} colSpan={2} className={`py-1.5 px-0.5 text-center ${ferieDay ? "bg-gray-100 dark:bg-gray-800/50" : ""}`}>
                              <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                {t(`leave.${leaveType}.short` as any)}
                              </span>
                            </td>
                          );
                        }
                        const hasValue = !!(getValue(emp.id, `${day.key}_start`) || getValue(emp.id, `${day.key}_end`));
                        const isCellSource = copiedCell?.empId === emp.id && copiedCell?.dayKey === day.key;
                        const showPaste = isCellCopyMode && !isCellSource;
                        return (
                          <td key={`${day.key}-cell`} colSpan={2} className={`py-1.5 px-0.5 ${isCellSource ? "bg-primary/10" : ferieDay ? "bg-muted/50" : ""}`}>
                            {isDirection ? (
                              /* Direction mode: single location select */
                              <div className="flex items-center gap-0.5">
                                <select
                                  value={getDisplayValue(emp.id, `${day.key}_start`)}
                                  onChange={(e) => {
                                    handleChange(emp.id, `${day.key}_start`, e.target.value);
                                    handleChange(emp.id, `${day.key}_end`, "");
                                  }}
                                  className="flex-1 min-w-0 px-1 py-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent text-center appearance-none cursor-pointer"
                                >
                                  <option value="">—</option>
                                  {locationOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                {!isCopyMode && !isCellCopyMode && hasValue && (
                                  <button
                                    onClick={() => copyCellSchedule(emp.id, day.key)}
                                    className="p-0.5 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                                    title={t("action.copy")}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                )}
                                {showPaste && (
                                  <button
                                    onClick={() => pasteCellSchedule(emp.id, day.key)}
                                    className="p-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors shrink-0"
                                    title={t("action.paste")}
                                  >
                                    <ClipboardPaste className="h-3 w-3" />
                                  </button>
                                )}
                                {isCellSource && (
                                  <button
                                    onClick={cancelCopy}
                                    className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    title={t("action.cancel")}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              /* Normal mode: two time selects */
                              <div className="flex items-center gap-0.5">
                              <select
                                value={getDisplayValue(emp.id, `${day.key}_start`)}
                                onChange={(e) => handleChange(emp.id, `${day.key}_start`, e.target.value)}
                                className="flex-1 min-w-0 px-0.5 py-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent font-mono-data text-center appearance-none cursor-pointer"
                              >
                                <option value="">—</option>
                                <option value="ROULEMENT">{t("schedule.rotation")}</option>
                                <option value="EXT">{t("schedule.exterior")}</option>
                                {TIME_SLOTS.map((ts) => (
                                  <option key={ts} value={ts}>{displayTimeBE(ts)}</option>
                                ))}
                              </select>
                              <select
                                value={getDisplayValue(emp.id, `${day.key}_end`)}
                                onChange={(e) => handleChange(emp.id, `${day.key}_end`, e.target.value)}
                                className="flex-1 min-w-0 px-0.5 py-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-accent font-mono-data text-center appearance-none cursor-pointer"
                              >
                                <option value="">—</option>
                                <option value="ROULEMENT">{t("schedule.rotation")}</option>
                                <option value="EXT">{t("schedule.exterior")}</option>
                                {TIME_SLOTS.map((ts) => (
                                  <option key={ts} value={ts}>{displayTimeBE(ts)}</option>
                                ))}
                              </select>
                              {!isCopyMode && !isCellCopyMode && hasValue && (
                                <button
                                  onClick={() => copyCellSchedule(emp.id, day.key)}
                                  className="p-0.5 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors shrink-0"
                                  title={t("action.copy")}
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              )}
                              {showPaste && (
                                <button
                                  onClick={() => pasteCellSchedule(emp.id, day.key)}
                                  className="p-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors shrink-0"
                                  title={t("action.paste")}
                                >
                                  <ClipboardPaste className="h-3 w-3" />
                                </button>
                              )}
                              {isCellSource && (
                                <button
                                  onClick={cancelCopy}
                                  className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                  title={t("action.cancel")}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            )}
                            {ferieDay && (
                              <div className="text-center mt-0.5">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded bg-foreground text-[8px] font-bold text-background uppercase">
                                  <Flag className="h-2 w-2" />{t("schedule.holiday")}
                                </span>
                              </div>
                            )}
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
