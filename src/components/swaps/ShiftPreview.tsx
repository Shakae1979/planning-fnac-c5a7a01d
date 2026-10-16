import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTimeBE, getMondayOf, formatLocalDate } from "@/lib/format";

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

/** Horaire planifié d'un collaborateur pour une date (lecture seule). */
export function useShiftOn(employeeId: string | undefined, date: string) {
  return useQuery({
    queryKey: ["shift-on", employeeId, date],
    enabled: !!employeeId && !!date,
    staleTime: 60_000,
    queryFn: async () => {
      const d = new Date(date + "T00:00:00");
      const dk = DAYS[(d.getDay() + 6) % 7];
      const ws = formatLocalDate(getMondayOf(d));
      const { data } = await (supabase as any).from("weekly_schedules")
        .select(`${dk}_start, ${dk}_end`).eq("employee_id", employeeId).eq("week_start", ws).maybeSingle();
      const s = data?.[`${dk}_start`] as string | null | undefined;
      const e = data?.[`${dk}_end`] as string | null | undefined;
      if (!s) return null;
      if (/^\d{1,2}:\d{2}/.test(s) && e) return `${formatTimeBE(s)}–${formatTimeBE(e)}`;
      return s;
    },
  });
}
