/**
 * Deterministic listing helpers for FlipKit Pro.
 *
 * Everything in this file is a pure function of its inputs: same input in,
 * same listing out. FlipKit has no live marketplace data feed, so nothing
 * here invents prices, sales volumes, or category IDs. Prices are the
 * seller's job (see the Pricing Calculator, which does real fee math);
 * these helpers draft honest, editable listing copy from what the seller
 * actually typed.
 */

export const TITLE_LIMIT = 80;

const FILLER_WORDS = new Set([
  "THE",
  "A",
  "AN",
  "AND",
  "OR",
  "WITH",
  "NICE",
  "LOOK",
  "L@@K",
]);

/** Truncate to at most `limit` chars without cutting a word in half. */
export function fitToLimit(text: string, limit: number = TITLE_LIMIT): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : clean.slice(0, limit)).trim();
}

/**
 * Clean up a raw eBay title: uppercase (FlipKit's house style), drop filler
 * words, remove duplicate words, and fit to the character limit at a word
 * boundary.
 */
export function optimizeTitle(title: string): string {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const raw of title.toUpperCase().split(/\s+/)) {
    const word = raw.replace(/^[^A-Z0-9]+|[^A-Z0-9&+'.-]+$/gi, "");
    if (!word) continue;
    if (FILLER_WORDS.has(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    words.push(word);
  }
  return fitToLimit(words.join(" "), TITLE_LIMIT);
}

const FEATURE_PHRASES: Array<{ pattern: RegExp; phrase: string }> = [
  { pattern: /\btested\b|\bworks\b|\bworking\b|\bfunctional\b/i, phrase: "Tested & Working" },
  { pattern: /\bsealed\b|\bunopened\b/i, phrase: "Factory Sealed" },
  { pattern: /\boriginal box\b|\bbox included\b|\bwith box\b/i, phrase: "With Original Box" },
  { pattern: /\bsigned\b|\bautograph/i, phrase: "Signed" },
  { pattern: /\bcomplete\b|\bfull set\b/i, phrase: "Complete" },
  { pattern: /\bvintage\b|\bretro\b/i, phrase: "Vintage" },
  { pattern: /\brare\b|\bhard to find\b/i, phrase: "Rare" },
];

/** Feature phrases the seller's own notes support — never added otherwise. */
export function detectFeatures(text: string): string[] {
  const found: string[] = [];
  for (const { pattern, phrase } of FEATURE_PHRASES) {
    if (pattern.test(text) && !found.includes(phrase)) found.push(phrase);
  }
  return found;
}

const CATEGORY_HINTS: Array<{ pattern: RegExp; paths: string[] }> = [
  {
    pattern: /walkman|cassette|headphone|earbud|speaker|turntable|vinyl|radio/i,
    paths: ["Consumer Electronics > Portable Audio & Headphones", "Consumer Electronics > Vintage Electronics"],
  },
  {
    pattern: /game ?boy|nintendo|playstation|xbox|sega|console|video game/i,
    paths: ["Video Games & Consoles > Video Game Consoles", "Video Games & Consoles > Video Games"],
  },
  {
    pattern: /camera|lens|tripod|gopro/i,
    paths: ["Cameras & Photo > Digital Cameras", "Cameras & Photo > Lenses & Filters"],
  },
  {
    pattern: /watch|timepiece/i,
    paths: ["Jewelry & Watches > Watches, Parts & Accessories"],
  },
  {
    pattern: /sneaker|shoes|boots|nike|adidas|jordan/i,
    paths: ["Clothing, Shoes & Accessories > Men's Shoes", "Clothing, Shoes & Accessories > Women's Shoes"],
  },
  {
    pattern: /jacket|shirt|dress|jeans|hoodie|coat/i,
    paths: ["Clothing, Shoes & Accessories > Men's Clothing", "Clothing, Shoes & Accessories > Women's Clothing"],
  },
  {
    pattern: /iphone|android|smartphone|phone case|laptop|macbook|tablet|ipad/i,
    paths: ["Cell Phones & Accessories > Cell Phones & Smartphones", "Computers/Tablets & Networking > Laptops & Netbooks"],
  },
  {
    pattern: /drill|wrench|tool|saw|hammer/i,
    paths: ["Home & Garden > Tools & Workshop Equipment"],
  },
  {
    pattern: /coin|stamp|card|comic|figurine|collecti/i,
    paths: ["Collectibles", "Sports Mem, Cards & Fan Shop > Sports Trading Cards"],
  },
];

/**
 * Category path suggestions based on the product name. These are starting
 * points for eBay's category browser, not official category IDs.
 */
export function suggestCategories(productName: string): string[] {
  for (const { pattern, paths } of CATEGORY_HINTS) {
    if (pattern.test(productName)) return [...paths];
  }
  return ["Use eBay's category browser and pick the closest leaf category for this item"];
}

const NON_BRAND_FIRST_WORDS = new Set([
  "the",
  "a",
  "an",
  "vintage",
  "vtg",
  "new",
  "used",
  "rare",
  "lot",
  "bundle",
]);

function guessBrand(productName: string): string {
  const first = productName.trim().split(/\s+/)[0] ?? "";
  if (!first || NON_BRAND_FIRST_WORDS.has(first.toLowerCase())) return "Unbranded";
  return first;
}

function bulletsFromNotes(notes: string): string[] {
  return notes
    .split(/[\n.;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .slice(0, 5);
}

export interface GeneratedListing {
  optimizedTitle: string;
  specifics: Record<string, string>;
  bulletPoints: string[];
  categorySuggestions: string[];
}

/**
 * Draft a listing from the seller's own inputs.
 *
 * The title is built from the product name plus only the feature phrases
 * the seller's notes actually support. Item specifics contain only what
 * can be honestly derived. No prices and no category IDs are fabricated —
 * FlipKit has no market data, and a made-up "recommended price" would be
 * worse than none.
 */
export function generateListing(
  productName: string,
  description: string,
  condition: string = "Used",
): GeneratedListing {
  const name = productName.trim();
  const notes = (description ?? "").trim();

  const features = detectFeatures(`${name} ${notes}`);
  const titleParts = [
    name,
    ...features.filter((f) => !name.toLowerCase().includes(f.toLowerCase())),
  ];
  const optimizedTitle = fitToLimit(
    titleParts.join(" ").replace(/\s+/g, " "),
    TITLE_LIMIT,
  );

  const specifics: Record<string, string> = {
    Brand: guessBrand(name),
    Condition: condition,
    MPN: "Does not apply",
    UPC: "Does not apply",
  };

  const noteBullets = bulletsFromNotes(notes);
  const bulletPoints = [
    ...noteBullets,
    "Please refer to photos for exact condition",
    "Ships securely within 1 business day",
    "From a smoke-free home",
  ].slice(0, 6);

  return {
    optimizedTitle,
    specifics,
    bulletPoints,
    categorySuggestions: suggestCategories(name),
  };
}

export type KeywordTier = "Core" | "Supporting" | "Long-tail";

export interface KeywordSuggestion {
  word: string;
  tier: KeywordTier;
}

const SUPPORTING_MODIFIERS = ["Vintage", "Authentic", "Original", "New", "Sealed"];
const LONGTAIL_SUFFIXES = ["Bundle Lot", "Gift", "Replacement", "For Parts"];

/**
 * Build a starter keyword list for a product type.
 *
 * Tiers describe how central a phrase is to the item (Core = the item
 * itself, Supporting = common high-intent modifiers, Long-tail = narrower
 * phrases). They are NOT search-volume rankings — FlipKit has no volume
 * data, and sellers should refine this list against sold listings.
 */
export function generateKeywords(category: string): KeywordSuggestion[] {
  const base = category.trim().replace(/\s+/g, " ");
  if (!base) return [];
  const out: KeywordSuggestion[] = [{ word: base, tier: "Core" }];
  for (const mod of SUPPORTING_MODIFIERS) {
    out.push({ word: `${mod} ${base}`, tier: "Supporting" });
  }
  for (const suffix of LONGTAIL_SUFFIXES) {
    out.push({ word: `${base} ${suffix}`, tier: "Long-tail" });
  }
  return out;
}

export function generateConditionText(
  condition: string,
  issues: string[],
  notes: string,
): string {
  let text = `Condition: ${condition}. `;
  if (issues.length > 0) {
    text += `Item has the following wear: ${issues.join(", ").toLowerCase()}. `;
  } else {
    text += `Item is in good shape with typical signs of use. `;
  }
  if (notes) {
    text += `Additional notes: ${notes}. `;
  }
  text += `Please see all photos for a detailed view of the exact item you will receive.`;
  return text;
}
