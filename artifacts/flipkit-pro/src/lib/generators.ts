export function generateListing(productName: string, description: string) {
  // Mock optimization logic
  const keywords = ["VTG", "RARE", "MINT", "FAST SHIP"];
  const titleWords = productName.split(' ').slice(0, 10);
  const optimizedTitle = [...titleWords, ...keywords].join(' ').substring(0, 80).toUpperCase();

  const specifics = {
    Brand: productName.split(' ')[0] || "Unbranded",
    Model: "Standard",
    Condition: "Used",
    MPN: "N/A",
    UPC: "Does not apply"
  };

  const bulletPoints = [
    `Tested and verified working`,
    `Ships securely within 1 business day`,
    `Clean cosmetic condition`,
    `From a smoke-free home`,
    `Please refer to photos for exact condition`
  ];

  const categories = [
    { id: "1234", name: "Electronics > Other" },
    { id: "5678", name: "Collectibles > Misc" },
    { id: "9012", name: "Home & Garden > Tools" }
  ];

  const priceRange = {
    low: (Math.random() * 50 + 10).toFixed(2),
    mid: (Math.random() * 50 + 60).toFixed(2),
    high: (Math.random() * 50 + 110).toFixed(2),
  };

  return { optimizedTitle, specifics, bulletPoints, categories, priceRange };
}

export function optimizeTitle(title: string) {
  const fillers = ["THE", "A", "AN", "AND", "OR", "WITH", "NICE", "LOOK"];
  let words = title.toUpperCase().split(/\s+/).filter(w => !fillers.includes(w));
  const optimized = words.join(' ').substring(0, 80);
  return optimized;
}

export function generateKeywords(category: string) {
  const base = ["Vintage", "Rare", "Bundle", "Lot", "New", "Sealed", "Authentic", "Original"];
  const generated = base.map(b => ({
    word: `${b} ${category}`,
    tier: Math.random() > 0.6 ? "High" : Math.random() > 0.3 ? "Medium" : "Low"
  }));
  return generated;
}

export function generateConditionText(condition: string, issues: string[], notes: string) {
  let text = `Condition: ${condition}. `;
  if (issues.length > 0) {
    text += `Item has the following wear: ${issues.join(', ')}. `;
  } else {
    text += `Item is in good shape with typical signs of use. `;
  }
  if (notes) {
    text += `Additional notes: ${notes}. `;
  }
  text += `Please see all photos for a detailed view of the exact item you will receive.`;
  return text;
}
