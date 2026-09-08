import { describe, expect, it } from "vitest";
import {
  extractSheetLookup,
  formatSheetCode,
  isValidSheetCode,
  normalizeSheetCode,
  randomSheetCode,
} from "../src/lib/sheet-code";

describe("sheet-code", () => {
  it("normalizes aliases and hyphens", () => {
    expect(normalizeSheetCode("7k4m-2q8r-xp6t")).toBe("7K4M2Q8RXP6T");
    expect(normalizeSheetCode("OIUL")).toBe("01V1");
  });

  it("formats for humans", () => {
    expect(formatSheetCode("7K4M2Q8RXP6T")).toBe("7K4M-2Q8R-XP6T");
  });

  it("extracts from grade URL", () => {
    expect(
      extractSheetLookup("https://anti-cheating-quiz.example.workers.dev/s/7K4M2Q8RXP6T"),
    ).toBe("7K4M2Q8RXP6T");
    expect(extractSheetLookup("7K4M-2Q8R-XP6T")).toBe("7K4M2Q8RXP6T");
  });

  it("accepts legacy 32-hex", () => {
    const hex = "a".repeat(32);
    expect(extractSheetLookup(hex)).toBe(hex);
  });

  it("mints valid codes", () => {
    const id = randomSheetCode();
    expect(isValidSheetCode(id)).toBe(true);
    expect(id).toHaveLength(12);
  });
});
