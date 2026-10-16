import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { formatDateBE, formatLocalDate, getDisplayName } from "@/lib/format";

interface Emp { id: string; name: string; last_name?: string | null; email?: string | null; store_id?: string | null }

const STATUS_STYLE: Record<string, string> = {
  pending_colleague: "bg-muted text-muted-foreground",
  pending_manager: "bg-accent/15 text-accent",
  approved: "bg-primary/15 text-primary",
};

export function useSwapStatusLabel() {
  const { t } = useI18n();
  return (s: string) => t(`swap.status.${s}` as any);
}

/** Bloc « Échanges de shifts » sur Mon planning — visible seulement pour le titulaire du compte. */
export function ShiftSwapPanel({ employee }: { employee: Emp }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const statusLabel = useSwapStatusLabel();
  const [open, setOpen] = useState(false);
  const today = formatLocalDate(new Date());
  const [myDate, setMyDate] = useState(today);
  const [targetId, setTargetId] = useState("");
  const [targetDate, setTargetDate] = useState(today);
  const [message, setMessage] = useState("");

  const isOwner = !!user?.email && !!employee.email && user.email.toLowerCase() === employee.email.toLowerCase();

  const { data: enabled } = useQuery({
    queryKey: ["store-swaps-enabled", employee.store_id],
    enabled: isOwner && !!employee.store_id,
    queryFn: async () => {
      const { data } = await (supabase as any).from("stores").select("has_shift_swaps").eq("id", employee.store_id).maybeSingle();
      return !!data?.has_shift_swaps;
    },
  });

  const { data: colleagues } = useQuery({
    queryKey: ["swap-colleagues", employee.store_id],
    enabled: isOwner && !!enabled,
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id, name, last_name").eq("store_id", employee.store_id!).eq("is_active", true).order("name");
      return (data ?? []).filter((e) => e.id !== employee.id) as Emp[];
    },
  });

  const { data: swaps } = useQuery({
    queryKey: ["shift-swaps-mine", employee.id],
    enabled: isOwner && !!enabled,
    queryFn: async () => {
      const { data } = await (supabase as any).from("shift_swaps").select("*")
        .or(`requester_id.eq.${employee.id},target_id.eq.${employee.id}`)
        .order("created_at", { ascending: false }).limit(20);
      return (data ?? []) as any[];
    },
  });

  const nameOf = (id: string) => {
    const c = colleagues?.find((e) => e.id === id);
    return c ? getDisplayName(c) : id === employee.id ? getDisplayName(employee) : "—";
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!targetId) throw new Error(t("swap.pickColleague" as any));
      const { error } = await (supabase as any).from("shift_swaps").insert({
        store_id: employee.store_id, requester_id: employee.id, target_id: targetId,
        requester_date: myDate, target_date: targetDate, message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("swap.sent" as any));
      setOpen(false); setMessage(""); setTargetId("");
      qc.invalidateQueries({ queryKey: ["shift-swaps-mine"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const respond = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { error } = await (supabase as any).rpc("respond_shift_swap", { _id: id, _action: action });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift-swaps-mine"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  if (!isOwner || !enabled) return null;

  const active = (swaps ?? []).filter((s) => s.status === "pending_colleague" || s.status === "pending_manager" || s.status === "approved").slice(0, 6);

  return (
    <div className="print:hidden mb-4 rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ArrowLeftRight className="h-4 w-4 text-accent" /> {t("swap.title" as any)}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{t("swap.propose" as any)}</Button>
      </div>

      {active.length === 0 && <p className="text-xs text-muted-foreground">{t("swap.none" as any)}</p>}
      {active.map((s) => {
        const incoming = s.target_id === employee.id;
        return (
          <div key={s.id} className="flex flex-wrap items-center gap-2 text-xs border-t border-border pt-2">
            <span className="font-medium">{nameOf(s.requester_id)}</span>
            <span className="text-muted-foreground">{formatDateBE(new Date(s.requester_date + "T00:00:00"))}</span>
            <ArrowLeftRight className="h-3 w-3" />
            <span className="font-medium">{nameOf(s.target_id)}</span>
            <span className="text-muted-foreground">{formatDateBE(new Date(s.target_date + "T00:00:00"))}</span>
            <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLE[s.status] ?? ""}`}>{statusLabel(s.status)}</span>
            {s.message && <span className="italic text-muted-foreground w-full">« {s.message} »</span>}
            <div className="ml-auto flex gap-1">
              {incoming && s.status === "pending_colleague" && (
                <>
                  <Button size="sm" className="h-7" onClick={() => respond.mutate({ id: s.id, action: "accept" })}><Check className="h-3 w-3 mr-1" />{t("swap.accept" as any)}</Button>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => respond.mutate({ id: s.id, action: "decline" })}><X className="h-3 w-3 mr-1" />{t("swap.decline" as any)}</Button>
                </>
              )}
              {!incoming && (s.status === "pending_colleague" || s.status === "pending_manager") && (
                <Button size="sm" variant="ghost" className="h-7" onClick={() => respond.mutate({ id: s.id, action: "cancel" })}>{t("swap.cancel" as any)}</Button>
              )}
            </div>
          </div>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("swap.propose" as any)}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="block space-y-1"><span>{t("swap.myDay" as any)}</span>
              <Input type="date" min={today} value={myDate} onChange={(e) => setMyDate(e.target.value)} /></label>
            <label className="block space-y-1"><span>{t("swap.colleague" as any)}</span>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder={t("swap.pickColleague" as any)} /></SelectTrigger>
                <SelectContent>{(colleagues ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{getDisplayName(c)}</SelectItem>)}</SelectContent>
              </Select></label>
            <label className="block space-y-1"><span>{t("swap.theirDay" as any)}</span>
              <Input type="date" min={today} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></label>
            <p className="text-xs text-muted-foreground">{t("swap.help" as any)}</p>
            <Input placeholder={t("swap.message" as any)} value={message} maxLength={200} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={() => create.mutate()} disabled={create.isPending}>{t("swap.send" as any)}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
