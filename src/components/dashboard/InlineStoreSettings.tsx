import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, CopyCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DAY_KEYS, type DayKey, type DayHoursMap, buildDefaultDayHours, timeToMin } from "@/hooks/useStoreSettings";

// Every half hour between 06:00 and 22:00
const TIME_OPTIONS: string[] = [];
for (let m = 6 * 60; m <= 22 * 60; m += 30) {
  TIME_OPTIONS.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}

interface Props {
  storeId: string;
  storeName: string;
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

export function InlineStoreSettings({ storeId }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<DayHoursMap | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["store-settings", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    setLocal(normalize(settings?.day_hours, settings?.schedule_start_hour ?? 9, settings?.schedule_end_hour ?? 20));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (next: DayHoursMap) => {
      const open = DAY_KEYS.filter((k) => !next[k].closed);
      const minStart = open.length ? Math.min(...open.map((k) => timeToMin(next[k].start))) : 9 * 60;
      const maxEnd = open.length ? Math.max(...open.map((k) => timeToMin(next[k].end))) : 20 * 60;
      const { error } = await supabase
        .from("store_settings")
        .upsert(
          {
            store_id: storeId,
            day_hours: next,
            schedule_start_hour: Math.floor(minStart / 60),
            schedule_end_hour: Math.ceil(maxEnd / 60),
          } as any,
          { onConflict: "store_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings", storeId] });
    },
  });

  if (!local) return null;

  const persist = async (next: DayHoursMap) => {
    setLocal(next);
    try {
      await saveMutation.mutateAsync(next);
      toast.success(t("settings.hoursSaved"));
    } catch {
      toast.error(t("settings.errorSaving"));
    }
  };

  const updateDay = (day: DayKey, patch: Partial<DayHoursMap[DayKey]>) => {
    const merged = { ...local[day], ...patch };
    if (!merged.closed && timeToMin(merged.start) >= timeToMin(merged.end)) {
      toast.error(t("settings.errorOrder"));
      return;
    }
    persist({ ...local, [day]: merged });
  };

  const applyToAll = () => {
    const ref = local.lundi;
    const next = DAY_KEYS.reduce((acc, k) => {
      acc[k] = { ...ref };
      return acc;
    }, {} as DayHoursMap);
    persist(next);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("settings.planningHours")}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1" onClick={applyToAll} disabled={saveMutation.isPending}>
          <CopyCheck className="h-3 w-3" />
          {t("settings.applyToAll")}
        </Button>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-[minmax(70px,1fr)_auto_auto_auto] items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("settings.day")}</span>
          <span className="w-[90px]">{t("settings.start")}</span>
          <span className="w-[90px]">{t("settings.end")}</span>
          <span>{t("settings.closed")}</span>
        </div>
        {DAY_KEYS.map((day) => {
          const d = local[day];
          return (
            <div key={day} className="grid grid-cols-[minmax(70px,1fr)_auto_auto_auto] items-center gap-2">
              <span className="text-xs font-medium capitalize">{t(`day.long.${day}` as any)}</span>
              <Select value={d.start} disabled={d.closed} onValueChange={(v) => updateDay(day, { start: v })}>
                <SelectTrigger className="h-7 w-[90px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o.replace(":", "h")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={d.end} disabled={d.closed} onValueChange={(v) => updateDay(day, { end: v })}>
                <SelectTrigger className="h-7 w-[90px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o.replace(":", "h")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Switch checked={d.closed} onCheckedChange={(c) => updateDay(day, { closed: c })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
