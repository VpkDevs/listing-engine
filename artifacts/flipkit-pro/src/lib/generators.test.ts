import { describe, it, expect } from "vitest";
import {
  generateListing,
  generateKeywords,
  generateConditionText,
  optimizeTitle,
  fitToLimit,
  detectFeatures,
  suggestCategories,
  TITLE_LIMIT,
} from "./generators";

describe("optimizeTitle", () => {
  it("strips filler words and uppercases", () => {
    expect(optimizeTitle("The Vintage Sony Walkman with a Nice Look")).toBe(
      "VINTAGE SONY WALKMAN",
    );
  });

  it("removes duplicate words", () => {
    expect(optimizeTitle("Sony Sony Walkman Walkman")).toBe("SONY WALKMAN");
  });

  it("never cuts a word in half at the 80-char limit", () => {
    const long =
      "Vintage Sony Walkman Cassette Player Recorder Radio Headphones Bundle Lot Rare Tested Working Great Condition";
    const out = optimizeTitle(long);
    expect(out.length).toBeLessThanOrEqual(TITLE_LIMIT);
    // Every word in the output must be a complete word from the input.
    const inputWords = new Set(long.toUpperCase().split(/\s+/));
    for (const w of out.split(/\s+/)) expect(inputWords.has(w)).toBe(true);
  });

  it("is deterministic", () => {
    const t = "Nike Mens Shoes Size 10 Blue Running Sneakers";
    expect(optimizeTitle(t)).toBe(optimizeTitle(t));
  });
});

describe("fitToLimit", () => {
  it("returns short text unchanged", () => {
    expect(fitToLimit("Sony Walkman", 80)).toBe("Sony Walkman");
  });
  it("cuts at a word boundary", () => {
    expect(fitToLimit("alpha beta gamma delta", 12)).toBe("alpha beta");
  });
});

describe("detectFeatures", () => {
  it("only claims features the notes support", () => {
    expect(detectFeatures("tested works great, with original box")).toEqual(
      expect.arrayContaining(["Tested & Working", "With Original Box"]),
    );
    expect(detectFeatures("small scratch on the back")).toEqual([]);
  });
});

describe("generateListing", () => {
  it("is deterministic — same input, same listing out", () => {
    const a = generateListing("Sony Walkman WM-FX281", "Tested works great", "Used");
    const b = generateListing("Sony Walkman WM-FX281", "Tested works great", "Used");
    expect(a).toEqual(b);
  });

  it("derives brand and condition honestly and fabricates no price", () => {
    const out = generateListing("Sony Walkman WM-FX281", "Tested works great", "Used") as any;
    expect(out.specifics.Brand).toBe("Sony");
    expect(out.specifics.Condition).toBe("Used");
    expect(out.priceRange).toBeUndefined();
    expect(JSON.stringify(out)).not.toMatch(/Math\.random/);
  });

  it("puts the seller's own notes into the bullets", () => {
    const out = generateListing("Nintendo Game Boy", "Powers on. Screen has light scratches", "Used");
    expect(out.bulletPoints.join(" ")).toContain("Powers on");
    expect(out.bulletPoints.join(" ")).toContain("Screen has light scratches");
  });

  it("adds 'Tested & Working' to the title only when the notes say so", () => {
    const tested = generateListing("Sony Walkman", "tested and working", "Used");
    expect(tested.optimizedTitle).toContain("Tested & Working");
    const untested = generateListing("Sony Walkman", "untested, for parts", "For Parts or Not Working");
    expect(untested.optimizedTitle).not.toContain("Tested & Working");
  });

  it("keeps the title within the limit", () => {
    const out = generateListing(
      "Extremely Long Product Name With Many Descriptive Words That Go On And On Forever And Ever",
      "sealed",
      "New",
    );
    expect(out.optimizedTitle.length).toBeLessThanOrEqual(TITLE_LIMIT);
  });

  it("returns Unbranded when the name starts with a non-brand word", () => {
    const out = generateListing("Vintage Denim Jacket", "", "Used");
    expect(out.specifics.Brand).toBe("Unbranded");
  });
});

describe("suggestCategories", () => {
  it("suggests a plausible path for a known product type", () => {
    expect(suggestCategories("Sony Walkman Cassette Player")[0]).toContain("Portable Audio");
  });
  it("falls back to honest guidance for unknown items", () => {
    expect(suggestCategories("Purple Widget Deluxe")[0]).toContain("category browser");
  });
});

describe("generateKeywords", () => {
  it("is deterministic and tiered Core → Supporting → Long-tail", () => {
    const a = generateKeywords("Coffee Mugs");
    expect(a).toEqual(generateKeywords("Coffee Mugs"));
    expect(a[0]).toEqual({ word: "Coffee Mugs", tier: "Core" });
    expect(a.some((k) => k.tier === "Supporting")).toBe(true);
    expect(a.some((k) => k.tier === "Long-tail")).toBe(true);
  });
  it("returns nothing for a blank category", () => {
    expect(generateKeywords("   ")).toEqual([]);
  });
});

describe("generateConditionText", () => {
  it("includes the condition, listed issues, and notes", () => {
    const text = generateConditionText("Used", ["Scratches", "Dents"], "Missing battery cover");
    expect(text).toContain("Condition: Used.");
    expect(text).toContain("scratches, dents");
    expect(text).toContain("Missing battery cover");
  });
  it("uses the good-shape wording when no issues are listed", () => {
    expect(generateConditionText("Used", [], "")).toContain("good shape");
  });
});
