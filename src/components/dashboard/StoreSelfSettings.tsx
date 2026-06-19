import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Store as StoreIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { InlineStoreSettings } from "./InlineStoreSettings";

export function StoreSelfSettings() {
  const { t } = useI18n();
  const { currentStore } = useStore();
  const queryClient = useQueryClient();

  const updateFlag = useMutation({
    mutationFn: async (values: { has_ab_weeks?: boolean; has_lunch_break?: boolean }) => {
      if (!currentStore) return;
      const { error } = await supabase.from("stores").update(values as any).eq("id", currentStore.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success(t("store.updated"));
    },
    onError: (err) => toast.error((err as Error).message),
  });

  if (!currentStore) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("settings.storeTitle")}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          <StoreIcon className="h-3.5 w-3.5" />
          {currentStore.name} · {t("settings.scopeNote")}
        </p>
      </div>

      <div className="kpi-card space-y-4">
        <div className="flex items-start gap-3">
          <Switch
            checked={currentStore.has_ab_weeks ?? false}
            onCheckedChange={(checked) => updateFlag.mutate({ has_ab_weeks: checked })}
            disabled={updateFlag.isPending}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{t("store.abWeeks")}</p>
            <p className="text-xs text-muted-foreground">{t("store.abWeeksDesc")}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Switch
            checked={currentStore.has_lunch_break ?? false}
            onCheckedChange={(checked) => updateFlag.mutate({ has_lunch_break: checked })}
            disabled={updateFlag.isPending}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{t("store.lunchBreak")}</p>
            <p className="text-xs text-muted-foreground">{t("store.lunchBreakDesc")}</p>
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <InlineStoreSettings storeId={currentStore.id} storeName={currentStore.name} />
      </div>
    </div>
  );
}