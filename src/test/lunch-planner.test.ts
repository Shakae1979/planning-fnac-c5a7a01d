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
  it("tôt 12h, journée 13h, tard 14h", () => {
    const r = planLunchBreaks([
      { id: "tot", role: "caisse", start: "09:00", end: "17:30" },
      { id: "long", role: "stock", start: "10:00", end: "19:00" },
      { id: "tard", role: "editorial", start: "11:30", end: "19:30" },
    ]);
    expect(s(r, "tot")).toBe("12:00");
    expect(s(r, "long")).toBe("13:00");
    expect(s(r, "tard")).toBe("14:00");
  });
  it("deux du même rayon seuls : jamais ensemble", () => {
    const r = planLunchBreaks([
      { id: "a", role: "caisse", start: "09:00", end: "17:30" },
      { id: "b", role: "caisse", start: "09:30", end: "18:00" },
    ]);
    expect(s(r, "a")).not.toBe(s(r, "b"));
  });
  it("ensemble autorisé si un 3e couvre le rayon", () => {
    const r = planLunchBreaks([
      { id: "a", role: "caisse", start: "09:00", end: "17:30" },
      { id: "b", role: "caisse", start: "09:00", end: "17:30" },
      { id: "c", role: "caisse", start: "11:00", end: "17:00" },
    ]);
    expect(s(r, "a")).toBe("12:00");
    expect(s(r, "b")).toBe("12:00");
  });
});
