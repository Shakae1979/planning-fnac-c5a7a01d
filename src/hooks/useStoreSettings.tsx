import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./useStore";

interface StoreSettings {
  schedule_start_hour: number;
  schedule_end_hour: number;
}

const DEFAULTS: StoreSettings = { schedule_start_hour: 9, schedule_end_hour: 20 };

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
      return data as (StoreSettings & { id: string; store_id: string }) | null;
    },
  });

  const scheduleStart = settings?.schedule_start_hour ?? DEFAULTS.schedule_start_hour;
  const scheduleEnd = settings?.schedule_end_hour ?? DEFAULTS.schedule_end_hour;

  const saveSettings = useMutation({
    mutationFn: async (values: StoreSettings) => {
      if (!currentStore) throw new Error("No store selected");
      const { error } = await supabase
        .from("store_settings")
        .upsert(
          { store_id: currentStore.id, ...values } as any,
          { onConflict: "store_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings", currentStore?.id] });
    },
  });

  return { scheduleStart, scheduleEnd, settings, isLoading, saveSettings };
}
