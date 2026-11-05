import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { enhanceListingWithAi, setGeminiKey, AiError, type ListingDraft } from "./aiEnhance";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
});

afterEach(() => {
  delete (globalThis as any).window;
});

const DRAFT: ListingDraft = {
  productName: "Sony Walkman WM-FX281",
  notes: "Tested works great",
  condition: "Used",
  draftTitle: "Sony Walkman WM-FX281 Tested & Working",
  draftBullets: ["Tested works great"],
};

function geminiResponse(text: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  } as Response;
}

describe("enhanceListingWithAi", () => {
  it("throws NO_KEY when no key is saved — never falls back silently", async () => {
    const fetchFn = vi.fn();
    await expect(enhanceListingWithAi(DRAFT, fetchFn as any)).rejects.toMatchObject({
      code: "NO_KEY",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("parses a well-formed Gemini JSON response", async () => {
    setGeminiKey("test-key-123");
    const fetchFn = vi.fn(async () =>
      geminiResponse(
        JSON.stringify({
          title: "Sony Walkman WM-FX281 Cassette Player — Tested & Working",
          bulletPoints: ["Fully tested and playing", "New belt fitted"],
          specifics: { Brand: "Sony", Condition: "Used" },
        }),
      ),
    );
    const out = await enhanceListingWithAi(DRAFT, fetchFn as any);
    expect(out.title).toContain("Sony Walkman");
    expect(out.bulletPoints).toHaveLength(2);
    expect(out.specifics.Brand).toBe("Sony");
    // The key must go in the API header, not the URL.
    const [url, init] = fetchFn.mock.calls[0] as any[];
    expect(String(url)).not.toContain("test-key-123");
    expect(init.headers["x-goog-api-key"]).toBe("test-key-123");
  });

  it("maps a 400/403 from Google to BAD_KEY", async () => {
    setGeminiKey("wrong-key");
    const fetchFn = vi.fn(async () => geminiResponse("{}", 403));
    await expect(enhanceListingWithAi(DRAFT, fetchFn as any)).rejects.toMatchObject({
      code: "BAD_KEY",
    });
  });

  it("maps a network failure to NETWORK", async () => {
    setGeminiKey("k");
    const fetchFn = vi.fn(async () => {
      throw new Error("socket hangup");
    });
    await expect(enhanceListingWithAi(DRAFT, fetchFn as any)).rejects.toMatchObject({
      code: "NETWORK",
    });
  });

  it("rejects a malformed AI payload as BAD_RESPONSE", async () => {
    setGeminiKey("k");
    const fetchFn = vi.fn(async () => geminiResponse("not json at all"));
    const err = await enhanceListingWithAi(DRAFT, fetchFn as any).catch((e) => e);
    expect(err).toBeInstanceOf(AiError);
    expect(err.code).toBe("BAD_RESPONSE");
  });

  it("clamps an over-long AI title to the 80-char limit at a word boundary", async () => {
    setGeminiKey("k");
    const longTitle =
      "Sony Walkman WM-FX281 Vintage Cassette Player Radio With Headphones Bundle Rare Tested Working";
    const fetchFn = vi.fn(async () =>
      geminiResponse(JSON.stringify({ title: longTitle, bulletPoints: ["ok"], specifics: {} })),
    );
    const out = await enhanceListingWithAi(DRAFT, fetchFn as any);
    expect(out.title.length).toBeLessThanOrEqual(80);
  });
});
