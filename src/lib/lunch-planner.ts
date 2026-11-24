// Répartition automatique des heures de table (1h, fin au plus tard 15h).
// Règles : qui arrive tôt mange tôt (≈3h après l'arrivée), le premier qui ouvre
// prend 12h–13h, et on évite au maximum que deux personnes du même métier
// soient en pause en même temps (quand c'est possible).
export interface LunchInput { id: string; role: string; start: string; end: string; }
export interface LunchResult { id: string; breakStart: string; breakEnd: string; }

const toMin = (t: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : NaN; };
const toStr = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const MAX_END = 15 * 60;
const SLOTS = [11, 11.5, 12, 12.5, 13, 13.5, 14].map((h) => h * 60);

export function planLunchBreaks(list: LunchInput[]): LunchResult[] {
  const eligible = list
    .map((e) => ({ ...e, s: toMin(e.start), en: toMin(e.end) }))
    .filter((e) => !isNaN(e.s) && !isNaN(e.en) && e.en - e.s > 360)
    .sort((a, b) => a.s - b.s || a.en - b.en);
  const load = new Map<number, number>();
  const roleLoad = new Map<string, number>();
  const out: LunchResult[] = [];
  eligible.forEach((e, i) => {
    const ok = SLOTS.filter((sl) => sl >= e.s + 120 && sl + 60 <= e.en - 60 && sl + 60 <= MAX_END);
    if (!ok.length) return;
    const target = Math.min(14 * 60, Math.max(11 * 60, e.s + 180));
    let pick: number;
    if (i === 0 && ok.includes(720)) pick = 720;
    else {
      const score = (x: number) =>
        (roleLoad.get(`${e.role}|${x}`) ?? 0) * 1000 + (load.get(x) ?? 0) * 2 + Math.abs(x - target) / 30 * 3 + (x > target ? 1 : 0);
      pick = ok.reduce((best, sl) => (score(sl) < score(best) ? sl : best), ok[0]);
    }
    for (const sl of SLOTS) if (Math.abs(sl - pick) < 60) {
      load.set(sl, (load.get(sl) ?? 0) + 1);
      roleLoad.set(`${e.role}|${sl}`, (roleLoad.get(`${e.role}|${sl}`) ?? 0) + 1);
    }
    out.push({ id: e.id, breakStart: toStr(pick), breakEnd: toStr(pick + 60) });
  });
  return out;
}
