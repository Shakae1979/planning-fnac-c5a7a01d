import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./useStore";

export const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
export type DayKey = typeof DAY_KEYS[number];

export interface DayHours {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  closed: boolean;
}

export type DayHoursMap = Record<DayKey, DayHours>;

const DEFAULT_START = 9;
const DEFAULT_END = 20;

export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildDefaultDayHours(startHour: number, endHour: number): DayHoursMap {
  const base: DayHours = {
    start: `${String(startHour).padStart(2, "0")}:00`,
    end: `${String(endHour).padStart(2, "0")}:00`,
    closed: false,
  };
  return DAY_KEYS.reduce((acc, k) => {
    acc[k] = { ...base };
    return acc;
  }, {} as DayHoursMap);
}

function normalize(raw: any, startHour: number, endHour: number): DayHoursMap {
  const fallback = buildDefaultDayHours(startHour, endHour);
  if (!raw || typeof raw !== "object") return fallback;
  return DAY_KEYS.reduce((acc, k) => {
    const v = raw[k];
    acc[k] = v && typeof v === "object" && typeof v.start === "string" && typeof v.end === "string"
      ? { start: v.start, end: v.end, closed: !!v.closed }
      : fallback[k];
    return acc;
  }, {} as DayHoursMap);
}

export function useStoreSettings() {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings", currentStore?.id],
    enabled: !!currentStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", currentStore!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const legacyStart = settings?.schedule_start_hour ?? DEFAULT_START;
  const legacyEnd = settings?.schedule_end_hour ?? DEFAULT_END;
  const dayHours = normalize(settings?.day_hours, legacyStart, legacyEnd);

  const openDays = DAY_KEYS.filter((k) => !dayHours[k].closed);
  const weekStartMin = openDays.length
    ? Math.min(...openDays.map((k) => timeToMin(dayHours[k].start)))
    : legacyStart * 60;
  const weekEndMin = openDays.length
    ? Math.max(...openDays.map((k) => timeToMin(dayHours[k].end)))
    : legacyEnd * 60;

  // Legacy hour-based amplitude (whole hours), used by views that need a coarse grid
  const scheduleStart = Math.floor(weekStartMin / 60);
  const scheduleEnd = Math.ceil(weekEndMin / 60);

  const getDayRange = (day: DayKey) => {
    const d = dayHours[day];
    return { startMin: timeToMin(d.start), endMin: timeToMin(d.end), closed: d.closed };
  };

  const saveDayHours = useMutation({
    mutationFn: async (next: DayHoursMap) => {
      if (!currentStore) throw new Error("No store selected");
      const open = DAY_KEYS.filter((k) => !next[k].closed);
      const minStart = open.length ? Math.min(...open.map((k) => timeToMin(next[k].start))) : legacyStart * 60;
      const maxEnd = open.length ? Math.max(...open.map((k) => timeToMin(next[k].end))) : legacyEnd * 60;
      const { error } = await supabase
        .from("store_settings")
        .upsert(
          {
            store_id: currentStore.id,
            day_hours: next,
            schedule_start_hour: Math.floor(minStart / 60),
            schedule_end_hour: Math.ceil(maxEnd / 60),
          } as any,
          { onConflict: "store_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings", currentStore?.id] });
    },
  });

  return {
    scheduleStart,
    scheduleEnd,
    weekStartMin,
    weekEndMin,
    dayHours,
    getDayRange,
    settings,
    isLoading,
    saveDayHours,
  };
}
