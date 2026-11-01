const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export interface MocaRow { code: string; weekStart: string; dayKey: string; date: string; amount: number }

function pad(n: number) { return String(n).padStart(2, "0"); }

/** Parse un export MOCA « Date;Store;Total;… » (dates D/M/YYYY, montants avec ou sans point de milliers). */
export function parseMocaCsv(text: string): MocaRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const iDate = head.indexOf("date"), iStore = head.indexOf("store"), iTot = head.indexOf("total");
  if (iDate < 0 || iStore < 0 || iTot < 0) throw new Error("format");
  const out: MocaRow[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(sep);
    const m = (c[iDate] || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) continue;
    const raw = (c[iTot] || "").split(",")[0].replace(/\D/g, "");
    const amount = raw ? parseInt(raw, 10) : 0;
    if (!amount) continue;
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    const dow = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - dow);
    out.push({
      code: (c[iStore] || "").trim(),
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      weekStart: `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`,
      dayKey: DAY_KEYS[dow],
      amount,
    });
  }
  return out;
}
