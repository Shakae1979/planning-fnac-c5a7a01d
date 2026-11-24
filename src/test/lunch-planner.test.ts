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
});
