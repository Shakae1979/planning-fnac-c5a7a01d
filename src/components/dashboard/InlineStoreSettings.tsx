import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 to 22

interface Props {
  storeId: string;
  storeName: string;
}

export function InlineStoreSettings({ storeId, storeName }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["store-settings", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const scheduleStart = settings?.schedule_start_hour ?? 9;
  const scheduleEnd = settings?.schedule_end_hour ?? 20;

  const saveMutation = useMutation({
    mutationFn: async (values: { schedule_start_hour: number; schedule_end_hour: number }) => {
      const { error } = await supabase
        .from("store_settings")
        .upsert({ store_id: storeId, ...values } as any, { onConflict: "store_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings", storeId] });
    },
  });

  const handleChange = async (field: "schedule_start_hour" | "schedule_end_hour", value: number) => {
    const newValues = {
      schedule_start_hour: field === "schedule_start_hour" ? value : scheduleStart,
      schedule_end_hour: field === "schedule_end_hour" ? value : scheduleEnd,
    };
    if (newValues.schedule_start_hour >= newValues.schedule_end_hour) {
      toast.error(t("settings.errorOrder"));
      return;
    }
    try {
      await saveMutation.mutateAsync(newValues);
      toast.success(t("settings.hoursSaved"));
    } catch {
      toast.error(t("settings.errorSaving"));
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("settings.planningHours")}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{t("settings.start")}</span>
          <Select value={String(scheduleStart)} onValueChange={(v) => handleChange("schedule_start_hour", Number(v))}>
            <SelectTrigger className="h-7 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.filter(h => h < scheduleEnd).map(h => (
                <SelectItem key={h} value={String(h)}>{h}h00</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground text-xs">→</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{t("settings.end")}</span>
          <Select value={String(scheduleEnd)} onValueChange={(v) => handleChange("schedule_end_hour", Number(v))}>
            <SelectTrigger className="h-7 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.filter(h => h > scheduleStart).map(h => (
                <SelectItem key={h} value={String(h)}>{h}h00</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
