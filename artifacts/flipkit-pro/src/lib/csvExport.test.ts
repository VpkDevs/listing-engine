import { describe, it, expect } from "vitest";
import { buildCSV } from "./csvExport";

describe("buildCSV", () => {
  it("builds a header plus one line per row", () => {
    expect(buildCSV([{ a: 1, b: "x" }, { a: 2, b: "y" }])).toBe("a,b\n1,x\n2,y");
  });

  it("quotes and escapes cells containing commas, quotes, or newlines", () => {
    const csv = buildCSV([{ name: 'Widget, "Deluxe"\nEdition' }]);
    expect(csv).toBe('name\n"Widget, ""Deluxe""\nEdition"');
  });

  it("renders null and undefined as empty cells", () => {
    expect(buildCSV([{ a: null, b: undefined, c: 0 }])).toBe("a,b,c\n,,0");
  });

  it("returns an empty string for no rows", () => {
    expect(buildCSV([])).toBe("");
  });
});
