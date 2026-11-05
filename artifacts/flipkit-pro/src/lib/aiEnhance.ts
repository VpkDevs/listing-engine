/**
 * Optional AI enhancement for the Listing Generator — bring your own key.
 *
 * The seller pastes their own Google Gemini API key in AI Settings. The
 * key is stored ONLY in this browser's localStorage and is sent ONLY to
 * Google's Gemini API when the seller clicks "Enhance with AI". FlipKit
 * ships with no key of its own, and when no key is configured (or the call
 * fails) the deterministic draft from generators.ts is used untouched —
 * the AI path never silently falls back to made-up output.
 */

import { fitToLimit, TITLE_LIMIT } from "./generators";

export const GEMINI_KEY_STORAGE = "flipkit-gemini-key";
export const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function getGeminiKey(): string | null {
  try {
    const key = window.localStorage.getItem(GEMINI_KEY_STORAGE);
    return key && key.trim() ? key.trim() : null;
  } catch {
    return null;
  }
}

export function setGeminiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) window.localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
    else window.localStorage.removeItem(GEMINI_KEY_STORAGE);
  } catch {
    /* storage unavailable — the setting simply won't persist */
  }
}

export function isAiConfigured(): boolean {
  return getGeminiKey() !== null;
}

export type AiErrorCode = "NO_KEY" | "BAD_KEY" | "HTTP" | "NETWORK" | "BAD_RESPONSE";

export class AiError extends Error {
  code: AiErrorCode;
  status?: number;
  constructor(code: AiErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export interface ListingDraft {
  productName: string;
  notes: string;
  condition: string;
  draftTitle: string;
  draftBullets: string[];
}

export interface AiListingEnhancement {
  title: string;
  bulletPoints: string[];
  specifics: Record<string, string>;
}

function buildPrompt(draft: ListingDraft): string {
  return [
    "You are an expert eBay listing copywriter. Improve the draft listing below.",
    "Rules:",
    `- The title must be at most ${TITLE_LIMIT} characters, keyword-rich, no ALL-CAPS spam words, no false claims.`,
    "- Write at most 5 short bullet points for the description.",
    "- Only state facts supported by the product name and seller notes. Never invent a brand, model, accessory, defect, or feature that is not supported.",
    "- Item specifics: include only entries you can support from the inputs; always include Condition.",
    'Return ONLY a JSON object shaped exactly like: {"title": string, "bulletPoints": string[], "specifics": {"Brand": string, "Condition": string}}',
    "",
    `Product name: ${draft.productName}`,
    `Seller notes: ${draft.notes || "(none)"}`,
    `Condition: ${draft.condition}`,
    `Draft title: ${draft.draftTitle}`,
    `Draft bullets: ${draft.draftBullets.join(" | ")}`,
  ].join("\n");
}

function parseEnhancement(raw: string): AiListingEnhancement {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new AiError("BAD_RESPONSE", "The AI returned text that was not valid JSON.");
  }
  const obj = data as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const bullets = Array.isArray(obj.bulletPoints)
    ? obj.bulletPoints.filter((b): b is string => typeof b === "string" && b.trim().length > 0)
    : [];
  if (!title || bullets.length === 0) {
    throw new AiError("BAD_RESPONSE", "The AI response was missing a title or bullets.");
  }
  const specifics: Record<string, string> = {};
  if (obj.specifics && typeof obj.specifics === "object") {
    for (const [k, v] of Object.entries(obj.specifics as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) specifics[k] = v;
    }
  }
  return {
    title: fitToLimit(title, TITLE_LIMIT),
    bulletPoints: bullets.slice(0, 5),
    specifics,
  };
}

type FetchFn = typeof fetch;

/**
 * Enhance a draft listing with the seller's own Gemini key.
 * Throws AiError with a specific code on any failure; the caller keeps the
 * deterministic draft in that case.
 */
export async function enhanceListingWithAi(
  draft: ListingDraft,
  fetchFn: FetchFn = fetch,
): Promise<AiListingEnhancement> {
  const key = getGeminiKey();
  if (!key) {
    throw new AiError(
      "NO_KEY",
      "No Gemini key saved. Add your free Google Gemini API key in AI Settings (sidebar) to use AI enhancement.",
    );
  }

  let res: Response;
  try {
    res = await fetchFn(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(draft) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    });
  } catch {
    throw new AiError("NETWORK", "Could not reach the Gemini API. Check your connection and try again.");
  }

  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new AiError(
        "BAD_KEY",
        "Google rejected that API key. Check the key in AI Settings and try again.",
        res.status,
      );
    }
    throw new AiError("HTTP", `Gemini API returned HTTP ${res.status}.`, res.status);
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new AiError("BAD_RESPONSE", "The Gemini API response could not be read.");
  }
  const text = (payload as any)?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text ?? "")
    .join("");
  if (!text) throw new AiError("BAD_RESPONSE", "The Gemini API returned an empty response.");
  return parseEnhancement(text);
}
