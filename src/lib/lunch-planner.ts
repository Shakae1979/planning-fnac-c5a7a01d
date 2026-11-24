// Répartition automatique des heures de table (1h, fin au plus tard 15h).
// 3 vagues selon l'arrivée : jusqu'à 10h → 12h-13h ; 10h01-10h59 → 13h-14h ; toujours ≥ 2h de présence avant la pause ;
// 11h et après → 14h-15h. Dans un même métier, on évite de manger ensemble,
// sauf s'il reste au moins un autre vendeur actif du métier pour couvrir.
export interface LunchInput { id: string; role: string; start: string; end: string; }
export interface LunchResult { id: string; breakStart: string; breakEnd: string; }

const toMin = (t: string) => { const m = /^(\d{1,2})[:h](\d{2})$/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : NaN; };
const toStr = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const MAX_END = 15 * 60;
const SLOTS = [11, 11.5, 12, 12.5, 13, 13.5, 14].map((h) => h * 60);

export function preferredSlot(startMin: number): number {
  if (startMin <= 600) return 720; // arrivée jusqu'à 10h → 12h
  if (startMin < 660) return 780;
  return 840;
}

export function planLunchBreaks(list: LunchInput[]): LunchResult[] {
  const all = list
    .map((e) => ({ ...e, s: toMin(e.start), en: toMin(e.end) }))
    .filter((e) => !isNaN(e.s) && !isNaN(e.en));
  const eligible = all.filter((e) => e.en - e.s > 360).sort((a, b) => a.s - b.s || a.en - b.en);
  const breaks = new Map<string, number>();
  const out: LunchResult[] = [];
  const overlaps = (a: number, b: number) => Math.abs(a - b) < 60;

  for (const e of eligible) {
    const ok = SLOTS.filter((sl) => sl >= e.s + 120 && sl + 60 <= e.en - 60 && sl + 60 <= MAX_END);
    if (!ok.length) continue;
    const target = preferredSlot(e.s);
    const score = (sl: number) => {
      // collègues du même métier présents sur tout le créneau
      const mates = all.filter((o) => o.id !== e.id && o.role === e.role && o.s <= sl && o.en >= sl + 60);
      const onBreak = mates.filter((o) => breaks.has(o.id) && overlaps(breaks.get(o.id)!, sl)).length;
      const active = mates.length - onBreak;
      let sc = Math.abs(sl - target) / 30 * 10;
      if (onBreak > 0) sc += active >= 1 ? 5 * onBreak : 1000 * onBreak; // ensemble seulement si couverture
      if (mates.length > 0 && active < 1) sc += 1000; // rayon vide
      return sc;
    };
    const pick = ok.reduce((best, sl) => (score(sl) < score(best) ? sl : best), ok[0]);
    breaks.set(e.id, pick);
    out.push({ id: e.id, breakStart: toStr(pick), breakEnd: toStr(pick + 60) });
  }
  return out;
}
