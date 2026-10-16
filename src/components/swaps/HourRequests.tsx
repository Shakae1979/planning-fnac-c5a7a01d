import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Check, X, ArrowRight } from "lucide-react";
import { formatDateBE, formatLocalDate, formatTimeBE, getDisplayName, getMondayOf } from "@/lib/format";

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const T = {
  title: { fr: "Changement d'horaire", nl: "Uurwijziging" },
  ask: { fr: "Demander un changement", nl: "Wijziging aanvragen" },
  none: { fr: "Aucune demande en cours", nl: "Geen lopende aanvragen" },
  date: { fr: "Jour concerné", nl: "Betrokken dag" },
  current: { fr: "Horaire actuel", nl: "Huidig uurrooster" },
  wanted: { fr: "Horaire souhaité", nl: "Gewenst uurrooster" },
  rest: { fr: "Repos / ne pas travailler", nl: "Rust / niet werken" },
  reason: { fr: "Motif (optionnel)", nl: "Reden (optioneel)" },
  send: { fr: "Envoyer au responsable", nl: "Naar verantwoordelijke sturen" },
  sent: { fr: "Demande envoyée au responsable", nl: "Aanvraag verstuurd" },
  cancel: { fr: "Annuler", nl: "Annuleren" },
  approve: { fr: "Valider", nl: "Goedkeuren" },
  reject: { fr: "Refuser", nl: "Weigeren" },
  toValidate: { fr: "Demandes de changement d'horaire", nl: "Aanvragen uurwijziging" },
  approved: { fr: "Horaire mis à jour", nl: "Uurrooster bijgewerkt" },
  rejected: { fr: "Demande refusée", nl: "Aanvraag geweigerd" },
  pending_manager: { fr: "En attente du responsable", nl: "Wacht op verantwoordelijke" },
  status_approved: { fr: "Validée", nl: "Goedgekeurd" },
  status_rejected: { fr: "Refusée", nl: "Geweigerd" },
  missing: { fr: "Indiquez l'heure de début et de fin (ex. 9h30)", nl: "Geef begin- en einduur op (bv. 9u30)" },
  invalidTime: { fr: "Horaire invalide — utilisez le format 24h (ex. 9h30)", nl: "Ongeldig uur — gebruik het 24-uursformat (bv. 9u30)" },
  timePlaceholder: { fr: "ex. 9h30", nl: "bv. 9u30" },
};
type K = keyof typeof T;
function useTx() { const { lang } = useI18n(); return (k: K) => T[k][lang === "nl" ? "nl" : "fr"]; }

const slot = (s?: string | null, e?: string | null, rest = "Repos") =>
  s && e && /\d/.test(s) ? `${formatTimeBE(s)}–${formatTimeBE(e)}` : (s || rest);
const d = (s: string) => formatDateBE(new Date(s + "T00:00:00"));

/** Saisie libre → "HH:MM" (format 24h européen). Accepte 9h30, 9u30, 09:30, 0930, 9. */
export function parseTimeBE(input: string): string | null {
  if (!input) return null;
  const c = input.trim().toLowerCase().replace("u", "h");
  let m = c.match(/^(\d{1,2})h(\d{0,2})$/) || c.match(/^(\d{1,2})[.:](\d{2})$/) || c.match(/^(\d{2})(\d{2})$/) || c.match(/^(\d{1,2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt((m[2] || "0").padStart(2, "0"), 10);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

interface Emp { id: string; name: string; last_name?: string | null; email?: string | null; store_id?: string | null }

/** Bloc vendeur : demande de changement d'horaire (sur Mon planning). */
export function HourRequestPanel({ employee }: { employee: Emp }) {
  const { user } = useAuth();
  const tx = useTx();
  const qc = useQueryClient();
  const today = formatLocalDate(new Date());
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rest, setRest] = useState(false);
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

  const week = formatLocalDate(getMondayOf(new Date(date + "T00:00:00")));
  const dk = DAYS[(new Date(date + "T00:00:00").getDay() + 6) % 7];
  const { data: current } = useQuery({
    queryKey: ["hour-req-current", employee.id, date],
    enabled: open && !!date,
    queryFn: async () => {
      const { data } = await supabase.from("weekly_schedules").select("*").eq("employee_id", employee.id).eq("week_start", week).maybeSingle();
      return { start: (data as any)?.[`${dk}_start`] ?? null, end: (data as any)?.[`${dk}_end`] ?? null };
    },
  });

  const { data: reqs } = useQuery({
    queryKey: ["hour-requests-mine", employee.id],
    enabled: isOwner && !!enabled,
    queryFn: async () => {
      const { data } = await (supabase as any).from("hour_change_requests").select("*").eq("employee_id", employee.id)
        .gte("date", today).order("date").limit(10);
      return (data ?? []) as any[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!rest && (!start.trim() || !end.trim())) throw new Error(tx("missing"));
      const s = rest ? null : parseTimeBE(start);
      const e = rest ? null : parseTimeBE(end);
      if (!rest && (!s || !e)) throw new Error(tx("invalidTime"));
      const { error } = await (supabase as any).from("hour_change_requests").insert({
        store_id: employee.store_id, employee_id: employee.id, date,
        current_start: current?.start ?? null, current_end: current?.end ?? null,
        new_start: s, new_end: e, message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tx("sent"));
      setOpen(false); setMessage(""); setStart(""); setEnd(""); setRest(false);
      qc.invalidateQueries({ queryKey: ["hour-requests-mine"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("respond_hour_request", { _id: id, _action: "cancel" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hour-requests-mine"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  if (!isOwner || !enabled) return null;
  const list = (reqs ?? []).filter((r) => r.status !== "cancelled");

  return (
    <div className="print:hidden mb-4 rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-accent" /> {tx("title")}</div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{tx("ask")}</Button>
      </div>
      {list.length === 0 && <p className="text-xs text-muted-foreground">{tx("none")}</p>}
      {list.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-2 text-xs border-t border-border pt-2">
          <span className="font-medium">{d(r.date)}</span>
          <span className="text-muted-foreground">{slot(r.current_start, r.current_end, tx("rest"))}</span>
          <ArrowRight className="h-3 w-3" />
          <span className="font-medium">{slot(r.new_start, r.new_end, tx("rest"))}</span>
          <span className="rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
            {r.status === "pending_manager" ? tx("pending_manager") : r.status === "approved" ? tx("status_approved") : tx("status_rejected")}
          </span>
          {r.status === "pending_manager" && (
            <Button size="sm" variant="ghost" className="h-7 ml-auto" onClick={() => cancel.mutate(r.id)}>{tx("cancel")}</Button>
          )}
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tx("ask")}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="block space-y-1"><span>{tx("date")}</span>
              <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <p className="text-xs text-muted-foreground">{tx("current")} : <b>{slot(current?.start, current?.end, tx("rest"))}</b></p>
            <div className="space-y-1">
              <span>{tx("wanted")}</span>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  placeholder={tx("timePlaceholder")}
                  value={start} disabled={rest}
                  onChange={(e) => setStart(e.target.value)}
                  onBlur={() => { const p = parseTimeBE(start); if (p) setStart(formatTimeBE(p)); }}
                />
                <Input
                  inputMode="numeric"
                  placeholder={tx("timePlaceholder")}
                  value={end} disabled={rest}
                  onChange={(e) => setEnd(e.target.value)}
                  onBlur={() => { const p = parseTimeBE(end); if (p) setEnd(formatTimeBE(p)); }}
                />
              </div>
              <label className="flex items-center gap-2 text-xs"><Checkbox checked={rest} onCheckedChange={(c) => setRest(!!c)} /> {tx("rest")}</label>
            </div>
            <Input placeholder={tx("reason")} value={message} maxLength={200} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={() => create.mutate()} disabled={create.isPending}>{tx("send")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Bouton responsable : validation des demandes de changement d'horaire (encodage du planning). */
export function HourRequestManager({ storeId }: { storeId: string }) {
  const tx = useTx();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: reqs } = useQuery({
    queryKey: ["hour-requests-store", storeId],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any).from("hour_change_requests").select("*").eq("store_id", storeId).eq("status", "pending_manager").order("date");
      return (data ?? []) as any[];
    },
  });
  const { data: emps } = useQuery({
    queryKey: ["swap-store-emps", storeId],
    enabled: !!reqs?.length,
    queryFn: async () => (await supabase.from("employees").select("id, name, last_name").eq("store_id", storeId)).data ?? [],
  });
  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { error } = await (supabase as any).rpc("respond_hour_request", { _id: id, _action: action });
      if (error) throw error;
      return action;
    },
    onSuccess: (action) => { toast.success(tx(action === "approve" ? "approved" : "rejected")); qc.invalidateQueries(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const count = reqs?.length ?? 0;
  const nameOf = (id: string) => { const e = emps?.find((x) => x.id === id); return e ? getDisplayName(e) : "—"; };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="relative print:hidden">
        <Clock className="h-3.5 w-3.5 mr-1" /> {tx("title")}
        {count > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">{count}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{tx("toValidate")}</DialogTitle></DialogHeader>
          {count === 0 && <p className="text-sm text-muted-foreground">{tx("none")}</p>}
          <div className="space-y-2">
            {(reqs ?? []).map((r) => (
              <div key={r.id} className="rounded-md border border-border p-2 text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <b>{nameOf(r.employee_id)}</b><span className="text-muted-foreground">{d(r.date)}</span>
                  <span>{slot(r.current_start, r.current_end, tx("rest"))}</span>
                  <ArrowRight className="h-3 w-3" />
                  <b>{slot(r.new_start, r.new_end, tx("rest"))}</b>
                </div>
                {r.message && <p className="text-xs italic text-muted-foreground">« {r.message} »</p>}
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: r.id, action: "reject" })} disabled={decide.isPending}><X className="h-3 w-3 mr-1" />{tx("reject")}</Button>
                  <Button size="sm" onClick={() => decide.mutate({ id: r.id, action: "approve" })} disabled={decide.isPending}><Check className="h-3 w-3 mr-1" />{tx("approve")}</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
