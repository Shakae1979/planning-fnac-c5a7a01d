import { describe, expect, it } from "vitest";
import { formatAmountBE, parseAmount } from "@/lib/format";

describe("parseAmount", () => {
  it("reads dot grouping", () => {
    expect(parseAmount("1.000.000")).toBe(1000000);
    expect(parseAmount("1.000")).toBe(1000);
    expect(parseAmount("12.000.500")).toBe(12000500);
  });

  it("reads comma decimals and mixed separators", () => {
    expect(parseAmount("42,5")).toBe(42.5);
    expect(parseAmount("1.000,50")).toBe(1000.5);
    expect(parseAmount("1,234.56")).toBe(1234.56);
  });

  it("tolerates spaces, currency and stray letters", () => {
    expect(parseAmount("1 000 000")).toBe(1000000);
    expect(parseAmount("1.000.000 €")).toBe(1000000);
    expect(parseAmount("36h")).toBe(36);
  });

  it("returns null for empty or non numeric text", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("   ")).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("formatAmountBE", () => {
  it("groups thousands with dots and appends €", () => {
    expect(formatAmountBE("1000000")).toBe("1.000.000 €");
    expect(formatAmountBE("1000")).toBe("1.000 €");
    expect(formatAmountBE(999)).toBe("999 €");
    expect(formatAmountBE("1234567,89")).toBe("1.234.567,89 €");
  });

  it("rounds to cents and keeps the sign", () => {
    expect(formatAmountBE("1234.567")).toBe("1.234,57 €");
    expect(formatAmountBE("-2500")).toBe("-2.500 €");
  });

  it("returns empty string when nothing is readable", () => {
    expect(formatAmountBE("")).toBe("");
    expect(formatAmountBE(null)).toBe("");
  });
});
