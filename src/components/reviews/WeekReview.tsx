import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotebookPen, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { formatLocalDate, formatDateBE, getWeekNumber } from "@/lib/format";

const LEVELS = ["calm", "normal", "busy", "exceptional"] as const;
const L = {
  fr: { btn: "Bilan de la semaine", title: "Bilan de la semaine", level: "Affluence", calm: "Calme", normal: "Normale", busy: "Forte affluence", exceptional: "Événement exceptionnel", summary: "Faits marquants", summaryPh: "Braderie, sortie majeure, panne caisse, rush imprévu…", advice: "Conseil pour l'an prochain", advicePh: "Ex. prévoir 2 personnes de plus en caisse samedi 14h–18h", save: "Enregistrer", saved: "Bilan enregistré", memory: "Mémoire N-1", by: "par", cancel: "Annuler" },
  nl: { btn: "Weekevaluatie", title: "Weekevaluatie", level: "Drukte", calm: "Rustig", normal: "Normaal", busy: "Zeer druk", exceptional: "Uitzonderlijk evenement", summary: "Opvallende gebeurtenissen", summaryPh: "Braderie, grote release, kassapanne, onverwachte drukte…", advice: "Advies voor volgend jaar", advicePh: "Bv. 2 extra mensen aan de kassa zaterdag 14u–18u", save: "Opslaan", saved: "Evaluatie opgeslagen", memory: "Geheugen J-1", by: "door", cancel: "Annuleren" },
};

/** Same ISO week one year earlier (52 weeks back, 53 if week numbers differ). */
export function sameWeekLastYear(monday: Date): Date {
  const d = new Date(monday); d.setDate(d.getDate() - 364);
  if (getWeekNumber(d) !== getWeekNumber(monday)) d.setDate(d.getDate() - 7);
  return d;
}

type Review = { id: string; traffic_level: string; summary: string; advice_next_year: string; author_name: string; week_start: string };

function useReview(storeId: string | undefined, weekStr: string) {
  return useQuery({
    queryKey: ["week-review", storeId, weekStr],
    enabled: !!storeId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("week_reviews").select("*").eq("store_id", storeId).eq("week_start", weekStr).maybeSingle();
      if (error) throw error;
      return data as Review | null;
    },
  });
}

export function WeekReviewButton({ storeId, monday }: { storeId: string; monday: Date }) {
  const { lang } = useI18n(); const tx = L[lang as "fr" | "nl"] ?? L.fr;
  const { user } = useAuth(); const qc = useQueryClient();
  const weekStr = formatLocalDate(monday);
  const { data } = useReview(storeId, weekStr);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState("normal"); const [summary, setSummary] = useState(""); const [advice, setAdvice] = useState("");
  useEffect(() => { if (open) { setLevel(data?.traffic_level ?? "normal"); setSummary(data?.summary ?? ""); setAdvice(data?.advice_next_year ?? ""); } }, [open, data]);
  const save = useMutation({
    mutationFn: async () => {
      const author = (user?.email ?? "").split("@")[0].split(".")[0];
      const { error } = await (supabase as any).from("week_reviews").upsert({ store_id: storeId, week_start: weekStr, traffic_level: level, summary: summary.trim(), advice_next_year: advice.trim(), author_name: author.charAt(0).toUpperCase() + author.slice(1) }, { onConflict: "store_id,week_start" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(tx.saved); qc.invalidateQueries({ queryKey: ["week-review"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <>
      <Button variant="outline" size="sm" className="h-8 text-xs print:hidden" onClick={() => setOpen(true)}>
        <NotebookPen className="h-3.5 w-3.5 mr-1" /> {tx.btn}{data ? " ✓" : ""}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{tx.title} — S{getWeekNumber(monday)} ({formatDateBE(monday)})</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-1">{tx.level}</p>
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map((l) => (
                  <Button key={l} type="button" size="sm" variant={level === l ? "default" : "outline"} className="h-7 text-xs" onClick={() => setLevel(l)}>{tx[l]}</Button>
                ))}
              </div>
            </div>
            <div><p className="text-xs font-medium mb-1">{tx.summary}</p><Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={tx.summaryPh} maxLength={2000} /></div>
            <div><p className="text-xs font-medium mb-1">{tx.advice}</p><Textarea rows={3} value={advice} onChange={(e) => setAdvice(e.target.value)} placeholder={tx.advicePh} maxLength={2000} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{tx.cancel}</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{tx.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LastYearMemory({ storeId, monday }: { storeId: string; monday: Date }) {
  const { lang } = useI18n(); const tx = L[lang as "fr" | "nl"] ?? L.fr;
  const prev = sameWeekLastYear(monday);
  const { data } = useReview(storeId, formatLocalDate(prev));
  const [collapsed, setCollapsed] = useState(false);
  if (!data || (!data.summary && !data.advice_next_year)) return null;
  return (
    <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm print:hidden">
      <button className="flex w-full items-center gap-2 font-semibold" onClick={() => setCollapsed(!collapsed)}>
        <Lightbulb className="h-4 w-4 text-primary" />
        {tx.memory} — S{getWeekNumber(prev)} / {prev.getFullYear()} · {tx[data.traffic_level as typeof LEVELS[number]] ?? data.traffic_level}
        {data.author_name && <span className="font-normal text-muted-foreground">({tx.by} {data.author_name})</span>}
        <span className="ml-auto">{collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</span>
      </button>
      {!collapsed && (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {data.summary && <div><p className="text-xs font-medium text-muted-foreground">{tx.summary}</p><p className="whitespace-pre-wrap">{data.summary}</p></div>}
          {data.advice_next_year && <div><p className="text-xs font-medium text-muted-foreground">{tx.advice}</p><p className="whitespace-pre-wrap">{data.advice_next_year}</p></div>}
        </div>
      )}
    </div>
  );
}
