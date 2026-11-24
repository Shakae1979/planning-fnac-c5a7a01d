import { describe, it, expect } from "vitest";
import { planLunchBreaks } from "@/lib/lunch-planner";

describe("planLunchBreaks", () => {
  it("le premier qui ouvre est en pause 12h-13h", () => {
    const r = planLunchBreaks([
      { id: "b", role: "caisse", start: "10:00", end: "19:00" },
      { id: "a", role: "caisse", start: "09:00", end: "18:00" },
    ]);
    expect(r.find((x) => x.id === "a")?.breakStart).toBe("12:00");
  });
  it("deux vendeurs du même métier ne sont pas en pause en même temps", () => {
    const r = planLunchBreaks([
      { id: "a", role: "caisse", start: "09:00", end: "18:00" },
      { id: "b", role: "caisse", start: "10:00", end: "19:00" },
    ]);
    expect(r[0].breakStart).not.toBe(r[1].breakStart);
  });
  it("pas de pause pour 6h pile", () => {
    expect(planLunchBreaks([{ id: "a", role: "caisse", start: "10:00", end: "16:00" }])).toHaveLength(0);
  });
  it("pause de 1h exactement, jamais après 15h", () => {
    const list = Array.from({ length: 12 }, (_, i) => ({ id: String(i), role: "caisse", start: "10:00", end: "19:00" }));
    for (const r of planLunchBreaks(list)) {
      const [sh, sm] = r.breakStart.split(":").map(Number);
      const [eh, em] = r.breakEnd.split(":").map(Number);
      expect(eh * 60 + em - (sh * 60 + sm)).toBe(60);
      expect(eh * 60 + em).toBeLessThanOrEqual(900);
    }
  });
  it("qui arrive tôt mange plus tôt que qui arrive tard", () => {
    const r = planLunchBreaks([
      { id: "x", role: "stock", start: "09:00", end: "17:30" },
      { id: "tot", role: "caisse", start: "09:00", end: "17:30" },
      { id: "tard", role: "editorial", start: "11:00", end: "19:00" },
    ]);
    const s = (id: string) => r.find((x) => x.id === id)!.breakStart;
    expect(s("tot") < s("tard")).toBe(true);
    expect(s("tot") <= "12:30").toBe(true);
  });
});

describe("3 vagues d'heures de table", () => {
  const s = (r: { id: string; breakStart: string }[], id: string) => r.find((x) => x.id === id)?.breakStart;
  it("tôt 12h, arrivée 10h → 12h, tard 14h", () => {
    const r = planLunchBreaks([
      { id: "tot", role: "caisse", start: "09:00", end: "17:30" },
      { id: "long", role: "stock", start: "10:00", end: "19:00" },
      { id: "tard", role: "editorial", start: "11:30", end: "19:30" },
    ]);
    expect(s(r, "tot")).toBe("12:00");
    expect(s(r, "long")).toBe("12:00");
    expect(s(r, "tard")).toBe("14:00");
  });
  it("deux du même rayon seuls : jamais ensemble", () => {
    const r = planLunchBreaks([
      { id: "a", role: "caisse", start: "09:00", end: "17:30" },
      { id: "b", role: "caisse", start: "09:30", end: "18:00" },
    ]);
    expect(s(r, "a")).not.toBe(s(r, "b"));
  });
  it("on étale les pauses plutôt que de manger ensemble", () => {
    const r = planLunchBreaks([
      { id: "a", role: "caisse", start: "09:00", end: "17:30" },
      { id: "b", role: "caisse", start: "09:00", end: "17:30" },
      { id: "c", role: "caisse", start: "11:00", end: "17:00" },
    ]);
    expect(s(r, "a")).toBe("12:00");
    expect(s(r, "b")).not.toBe("12:00");
  });
});

import { planLunchBreaks as plan2 } from "@/lib/lunch-planner";
describe("règle 2h avant pause", () => {
  it("arrivée 10h seule → 12h-13h", () => {
    expect(plan2([{ id: "a", role: "caisse", start: "10:00", end: "19:00" }])[0].breakStart).toBe("12:00");
  });
  it("deux arrivées 10h même rayon → 12h et 13h", () => {
    const r = plan2([{ id: "a", role: "caisse", start: "10:00", end: "19:00" }, { id: "b", role: "caisse", start: "10:00", end: "19:00" }]);
    expect(r.map((x) => x.breakStart).sort()).toEqual(["12:00", "13:00"]);
  });
  it("jamais moins de 2h après l'arrivée", () => {
    const r = plan2([{ id: "a", role: "x", start: "11:00", end: "19:00" }]);
    expect(r[0].breakStart >= "13:00").toBe(true);
  });
});

describe("Charleroi éditorial (5 vendeurs)", () => {
  it("jamais 3 en pause en même temps", () => {
    const r = plan2([["a","10:00","18:00"],["b","11:00","19:00"],["c","10:00","18:00"],["d","11:00","19:00"],["e","10:00","19:00"]].map(([id,start,end]) => ({ id, role: "editorial", start, end })));
    const n: Record<string, number> = {};
    r.forEach((x) => { n[x.breakStart] = (n[x.breakStart] || 0) + 1; });
    expect(Math.max(...Object.values(n))).toBeLessThanOrEqual(2);
  });
});
