import { describe, it, expect } from "vitest";
import { parseTimeBE } from "@/components/swaps/HourRequests";

describe("parseTimeBE (format horaire européen 24h)", () => {
  it("accepte 9h30", () => expect(parseTimeBE("9h30")).toBe("09:30"));
  it("accepte 09h00", () => expect(parseTimeBE("09h00")).toBe("09:00"));
  it("accepte 9u30 (néerlandais)", () => expect(parseTimeBE("9u30")).toBe("09:30"));
  it("accepte 09:30", () => expect(parseTimeBE("09:30")).toBe("09:30"));
  it("accepte 0930", () => expect(parseTimeBE("0930")).toBe("09:30"));
  it("accepte 9 seul", () => expect(parseTimeBE("9")).toBe("09:00"));
  it("refuse 25h00", () => expect(parseTimeBE("25h00")).toBeNull());
  it("refuse 9h75", () => expect(parseTimeBE("9h75")).toBeNull());
  it("refuse une chaîne vide", () => expect(parseTimeBE("")).toBeNull());
  it("refuse du texte libre", () => expect(parseTimeBE("abc")).toBeNull());
});
