import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Store as StoreIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { InlineStoreSettings } from "./InlineStoreSettings";
import { MocaImport } from "./MocaImport";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function MocaCodeField({ storeId }: { storeId: string }) {
  const { lang } = useI18n() as any;
  const nl = lang === "nl";
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["moca-stores", storeId],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("id,name,moca_code,is_direction").eq("id", storeId);
      if (error) throw error;
      return data as any[];
    },
  });
  const current = data?.[0]?.moca_code ?? "";
  const [val, setVal] = useState("");
  useEffect(() => setVal(current), [current]);
  const save = async () => {
    const code = val.trim() || null;
    if (code && !/^\d{3,6}$/.test(code)) { toast.error(nl ? "Ongeldige code (cijfers)" : "Code invalide (chiffres uniquement)"); return; }
    const { error } = await supabase.from("stores").update({ moca_code: code } as any).eq("id", storeId);
    if (error) { toast.error(error.code === "23505" ? (nl ? "Deze code is al gekoppeld aan een andere winkel" : "Ce code est déjà attribué à un autre magasin") : error.message); return; }
    qc.invalidateQueries({ queryKey: ["moca-stores"] });
    toast.success(nl ? "MOCA-code opgeslagen" : "Code MOCA enregistré");
  };
  return (
    <div className="flex items-start gap-3 pt-2 border-t border-border">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{nl ? "MOCA-centrumcode" : "Code centre MOCA"}</p>
        <p className="text-xs text-muted-foreground">{nl ? "Code van uw winkel in de MOCA-export (bv. 5904)." : "Code de votre magasin dans l'export MOCA (ex. 5904 pour Charleroi)."}</p>
      </div>
      <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="5904" className="h-8 w-24 font-mono" inputMode="numeric" />
      <Button size="sm" variant="outline" onClick={save} disabled={val === current}>{nl ? "Opslaan" : "Enregistrer"}</Button>
    </div>
  );
}

export function StoreSelfSettings() {
  const { t } = useI18n();
  const { currentStore, refreshStores } = useStore();
  const queryClient = useQueryClient();

  const updateFlag = useMutation({
    mutationFn: async (values: { has_ab_weeks?: boolean; has_lunch_break?: boolean; has_multi_roles?: boolean; has_two_floors?: boolean }) => {
      if (!currentStore) return;
      const { error } = await supabase.from("stores").update(values as any).eq("id", currentStore.id);
      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      refreshStores();
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

        <div className="flex items-start gap-3">
          <Switch
            checked={currentStore.has_multi_roles ?? false}
            onCheckedChange={(checked) => updateFlag.mutate({ has_multi_roles: checked })}
            disabled={updateFlag.isPending}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{t("store.multiRoles")}</p>
            <p className="text-xs text-muted-foreground">{t("store.multiRolesDesc")}</p>
          </div>
        </div>

        {currentStore.has_multi_roles && (
          <div className="flex items-start gap-3 pl-6 border-l-2 border-border">
            <Switch
              checked={currentStore.has_two_floors ?? false}
              onCheckedChange={(checked) => updateFlag.mutate({ has_two_floors: checked })}
              disabled={updateFlag.isPending}
            />
            <div>
              <p className="text-sm font-medium text-foreground">{t("store.twoFloors")}</p>
              <p className="text-xs text-muted-foreground">{t("store.twoFloorsDesc")}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Switch
            checked={currentStore.has_budget ?? false}
            onCheckedChange={(checked) => updateFlag.mutate({ has_budget: checked } as any)}
            disabled={updateFlag.isPending}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{t("store.budget" as any)}</p>
            <p className="text-xs text-muted-foreground">{t("store.budgetDesc" as any)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Switch
            checked={currentStore.has_weather ?? false}
            onCheckedChange={(checked) => updateFlag.mutate({ has_weather: checked } as any)}
            disabled={updateFlag.isPending}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{t("store.weather" as any)}</p>
            <p className="text-xs text-muted-foreground">{t("store.weatherDesc" as any)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Switch
            checked={currentStore.has_shift_swaps ?? false}
            onCheckedChange={(checked) => updateFlag.mutate({ has_shift_swaps: checked } as any)}
            disabled={updateFlag.isPending}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{t("store.shiftSwaps" as any)}</p>
            <p className="text-xs text-muted-foreground">{t("store.shiftSwapsDesc" as any)}</p>
          </div>
        </div>

        <MocaCodeField storeId={currentStore.id} />
      </div>

      {currentStore.has_budget && <MocaImport storeId={currentStore.id} />}

      <div className="kpi-card">
        <InlineStoreSettings storeId={currentStore.id} storeName={currentStore.name} />
      </div>
    </div>
  );
}