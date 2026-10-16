import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { formatDateBE, getDisplayName } from "@/lib/format";

/** Bouton + fenêtre de validation des échanges pour les responsables (encodage du planning). */
export function ShiftSwapManager({ storeId }: { storeId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: swaps } = useQuery({
    queryKey: ["shift-swaps-store", storeId],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any).from("shift_swaps").select("*").eq("store_id", storeId).eq("status", "pending_manager").order("created_at");
      return (data ?? []) as any[];
    },
  });
  const { data: emps } = useQuery({
    queryKey: ["swap-store-emps", storeId],
    enabled: !!swaps?.length,
    queryFn: async () => (await supabase.from("employees").select("id, name, last_name").eq("store_id", storeId)).data ?? [],
  });

  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { error } = await (supabase as any).rpc("respond_shift_swap", { _id: id, _action: action });
      if (error) throw error;
      return action;
    },
    onSuccess: (action) => {
      toast.success(t(action === "approve" ? "swap.approved" : "swap.rejected" as any));
      qc.invalidateQueries({ queryKey: ["shift-swaps-store"] });
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const count = swaps?.length ?? 0;
  const nameOf = (id: string) => { const e = emps?.find((x) => x.id === id); return e ? getDisplayName(e) : "—"; };
  const d = (s: string) => formatDateBE(new Date(s + "T00:00:00"));

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="relative">
        <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> {t("swap.title" as any)}
        {count > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">{count}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("swap.toValidate" as any)}</DialogTitle></DialogHeader>
          {count === 0 && <p className="text-sm text-muted-foreground">{t("swap.none" as any)}</p>}
          <div className="space-y-2">
            {(swaps ?? []).map((s) => (
              <div key={s.id} className="rounded-md border border-border p-2 text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <b>{nameOf(s.requester_id)}</b><span className="text-muted-foreground">({d(s.requester_date)})</span>
                  <ArrowLeftRight className="h-3 w-3" />
                  <b>{nameOf(s.target_id)}</b><span className="text-muted-foreground">({d(s.target_date)})</span>
                </div>
                {s.message && <p className="text-xs italic text-muted-foreground">« {s.message} »</p>}
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: s.id, action: "reject" })} disabled={decide.isPending}><X className="h-3 w-3 mr-1" />{t("swap.reject" as any)}</Button>
                  <Button size="sm" onClick={() => decide.mutate({ id: s.id, action: "approve" })} disabled={decide.isPending}><Check className="h-3 w-3 mr-1" />{t("swap.approve" as any)}</Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("swap.managerHelp" as any)}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
