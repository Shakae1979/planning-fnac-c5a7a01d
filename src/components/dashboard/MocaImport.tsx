import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { parseMocaCsv, MocaRow } from "@/lib/moca";
import { formatAmountBE } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function MocaImport({ storeId: onlyStore }: { storeId?: string } = {}) {
  const { lang } = useI18n() as any;
  const nl = lang === "nl";
  const qc = useQueryClient();
  const [rows, setRows] = useState<MocaRow[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { data: stores } = useQuery({
    queryKey: ["moca-stores", onlyStore ?? "all"],
    queryFn: async () => {
      let q = supabase.from("stores").select("id,name,moca_code,is_direction").order("name");
      if (onlyStore) q = q.eq("id", onlyStore);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).filter((s: any) => !s.is_direction) as { id: string; name: string; moca_code: string | null }[];
    },
  });

  const groups = useMemo(() => {
    const g: Record<string, { total: number; days: number }> = {};
    rows.forEach((r) => { g[r.code] ??= { total: 0, days: 0 }; g[r.code].total += r.amount; g[r.code].days++; });
    return g;
  }, [rows]);

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const text = new TextDecoder("windows-1252").decode(buf);
      let parsed = parseMocaCsv(text);
      if (onlyStore) {
        const code = stores?.[0]?.moca_code;
        if (!code) { toast.error(nl ? "Vul eerst de MOCA-code van uw winkel in" : "Renseignez d'abord le code centre MOCA de votre magasin"); return; }
        parsed = parsed.filter((r) => r.code === code);
      }
      setRows(parsed);
      const m: Record<string, string> = {};
      stores?.forEach((s) => { if (s.moca_code) m[s.moca_code] = s.id; });
      setMap(m);
      if (!parsed.length) toast.error(nl ? "Geen budget gevonden" : "Aucun budget trouvé dans le fichier");
    } catch {
      toast.error(nl ? "Ongeldig MOCA-bestand" : "Fichier MOCA invalide (colonnes Date / Store / Total attendues)");
    }
  };

  const doImport = async () => {
    setBusy(true);
    try {
      let n = 0;
      for (const [code, storeId] of Object.entries(map)) {
        if (!storeId || !groups[code]) continue;
        const prev = stores?.find((s) => s.moca_code === code && s.id !== storeId);
        if (prev) await supabase.from("stores").update({ moca_code: null } as any).eq("id", prev.id);
        await supabase.from("stores").update({ moca_code: code } as any).eq("id", storeId);
        const mine = rows.filter((r) => r.code === code);
        const weeks = [...new Set(mine.map((r) => r.weekStart))];
        const { data: existing, error } = await supabase.from("day_comments").select("id,week_start,day_key").eq("store_id", storeId).in("week_start", weeks);
        if (error) throw error;
        for (const r of mine) {
          const ex = existing?.find((e) => e.week_start === r.weekStart && e.day_key === r.dayKey);
          const res = ex
            ? await supabase.from("day_comments").update({ budget: String(r.amount) } as any).eq("id", ex.id)
            : await supabase.from("day_comments").insert({ store_id: storeId, week_start: r.weekStart, day_key: r.dayKey, comment: "", is_ferie: false, budget: String(r.amount) } as any);
          if (res.error) throw res.error;
          n++;
        }
      }
      toast.success(nl ? `${n} dagbudgetten geïmporteerd` : `${n} budgets journaliers importés`);
      setRows([]);
      qc.invalidateQueries({ queryKey: ["day-comments"] });
      qc.invalidateQueries({ queryKey: ["moca-stores"] });
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const codes = Object.keys(groups).sort();

  return (
    <div className="kpi-card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">{nl ? "Budget importeren (MOCA)" : "Importer un budget MOCA"}</h3>
          <p className="text-xs text-muted-foreground">{nl ? "CSV-export per centrum: de kolom Total wordt per dag ingevuld." : "Export CSV par centre : la colonne Total est reprise comme budget du jour."}</p>
        </div>
        <label className="inline-flex">
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <span className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent">
            <Upload className="h-4 w-4" /> {nl ? "Bestand kiezen" : "Choisir le fichier"}
          </span>
        </label>
      </div>
      {codes.length > 0 && (
        <>
          <div className="divide-y divide-border border border-border rounded-md">
            {codes.map((c) => (
              <div key={c} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="font-mono w-14">{c}</span>
                <span className="text-muted-foreground w-40">{formatAmountBE(groups[c].total)} · {groups[c].days} {nl ? "d." : "j."}</span>
                <Select value={map[c] || "none"} onValueChange={(v) => setMap((m) => ({ ...m, [c]: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{nl ? "— Niet importeren —" : "— Ne pas importer —"}</SelectItem>
                    {stores?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRows([])}>{nl ? "Annuleren" : "Annuler"}</Button>
            <Button size="sm" onClick={doImport} disabled={busy || !Object.values(map).some(Boolean)}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{nl ? "Importeren" : "Importer"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{nl ? "Bestaande budgetten voor deze dagen worden overschreven. De koppeling code ↔ winkel wordt onthouden." : "Les budgets déjà saisis pour ces jours sont remplacés. L'association code ↔ magasin est mémorisée pour les prochains imports."}</p>
        </>
      )}
    </div>
  );
}
