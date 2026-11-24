// Répartition automatique des heures de table (1h).
// Règle : le premier vendeur qui ouvre prend 12h–13h, puis les suivants sont
// étalés sur les créneaux 11h–15h pour garder un maximum de monde en surface,
// en évitant que deux personnes du même métier soient en pause en même temps.
export interface LunchInput { id: string; role: string; start: string; end: string; }
export interface LunchResult { id: string; breakStart: string; breakEnd: string; }

const toMin = (t: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : NaN; };
const toStr = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const SLOTS = [12, 13, 14, 11.5, 12.5, 13.5, 11, 14.5, 15].map((h) => h * 60);

export function planLunchBreaks(list: LunchInput[]): LunchResult[] {
  const eligible = list
    .map((e) => ({ ...e, s: toMin(e.start), en: toMin(e.end) }))
    .filter((e) => !isNaN(e.s) && !isNaN(e.en) && e.en - e.s > 360) // strictement > 6h
    .sort((a, b) => a.s - b.s || a.en - b.en);
  const load = new Map<number, number>();
  const roleLoad = new Map<string, number>();
  const out: LunchResult[] = [];
  eligible.forEach((e, i) => {
    const ok = SLOTS.filter((sl) => sl >= e.s + 120 && sl + 60 <= e.en - 60);
    if (!ok.length) return;
    let pick: number;
    if (i === 0 && ok.includes(720)) pick = 720;
    else {
      pick = ok.reduce((best, sl) => {
        const score = (x: number) => (roleLoad.get(`${e.role}|${x}`) ?? 0) * 100 + (load.get(x) ?? 0) * 10 + SLOTS.indexOf(x);
        return score(sl) < score(best) ? sl : best;
      }, ok[0]);
    }
    // une pause d'1h chevauche les demi-heures voisines
    for (const sl of SLOTS) if (Math.abs(sl - pick) < 60) {
      load.set(sl, (load.get(sl) ?? 0) + 1);
      roleLoad.set(`${e.role}|${sl}`, (roleLoad.get(`${e.role}|${sl}`) ?? 0) + 1);
    }
    out.push({ id: e.id, breakStart: toStr(pick), breakEnd: toStr(pick + 60) });
  });
  return out;
}
