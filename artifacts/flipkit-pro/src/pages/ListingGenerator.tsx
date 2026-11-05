import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Download, Wand2, Check, Package, Truck, Tag, Star, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateListing, type GeneratedListing } from "@/lib/generators";
import { exportToCSV } from "@/lib/csvExport";
import { enhanceListingWithAi, isAiConfigured, AiError } from "@/lib/aiEnhance";

const CONDITIONS = [
  "New",
  "New Other",
  "Certified Refurbished",
  "Seller Refurbished",
  "Used",
  "For Parts or Not Working",
];

function bumpStatsListings() {
  const prev = Number(localStorage.getItem("flipkit-stats-listings") || 0);
  localStorage.setItem("flipkit-stats-listings", String(prev + 1));
  window.dispatchEvent(new Event("flipkit-stats-updated"));
}

function CharCount({ value, max = 80 }: { value: string; max?: number }) {
  const len = value.length;
  const colorClass =
    len > 75 ? "text-red-500" : len >= 65 ? "text-amber-400" : "text-green-500";
  const barColor =
    len > 75 ? "bg-red-500" : len >= 65 ? "bg-amber-400" : "bg-green-500";
  const pct = Math.min((len / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Character count</span>
        <span className={`font-mono font-bold ${colorClass}`}>
          {len} / {max}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function ListingGenerator() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("Used");
  const [results, setResults] = useState<GeneratedListing | null>(null);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!productName) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    const generated = generateListing(productName, description, condition);
    setResults(generated);
    setAiEnhanced(false);
    bumpStatsListings();
  };

  const handleEnhanceWithAi = async () => {
    if (!results) return;
    if (!isAiConfigured()) {
      toast({
        title: "AI not set up yet",
        description: "Add your free Google Gemini API key in AI Settings (bottom of the sidebar). Your key never leaves this browser except to call Google.",
        variant: "destructive",
      });
      return;
    }
    setEnhancing(true);
    try {
      const ai = await enhanceListingWithAi({
        productName,
        notes: description,
        condition,
        draftTitle: results.optimizedTitle,
        draftBullets: results.bulletPoints,
      });
      setResults({
        ...results,
        optimizedTitle: ai.title,
        bulletPoints: ai.bulletPoints,
        specifics: { ...results.specifics, ...ai.specifics },
      });
      setAiEnhanced(true);
      toast({ title: "Enhanced with AI", description: "Review the draft before posting — AI can still get details wrong." });
    } catch (err) {
      const message = err instanceof AiError ? err.message : "AI enhancement failed. Your draft is unchanged.";
      toast({ title: "AI enhancement failed", description: message, variant: "destructive" });
    } finally {
      setEnhancing(false);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({ title: "Copied!", description: `${section} copied to clipboard.` });
  };

  const handleCopyAll = () => {
    if (!results) return;
    const text = [
      `TITLE:\n${results.optimizedTitle}`,
      `\nITEM SPECIFICS:\n${Object.entries(results.specifics)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")}`,
      `\nDESCRIPTION:\n${results.bulletPoints.map((b) => `• ${b}`).join("\n")}`,
      `\nCATEGORY SUGGESTIONS:\n${results.categorySuggestions.join("\n")}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Full listing copied to clipboard." });
  };

  const handleExportCSV = () => {
    if (!results) return;
    const row = {
      Title: results.optimizedTitle,
      Brand: results.specifics.Brand,
      Condition: results.specifics.Condition,
      MPN: results.specifics.MPN,
      UPC: results.specifics.UPC,
      Description: results.bulletPoints.join(" | "),
      CategorySuggestion: results.categorySuggestions[0] ?? "",
    };
    exportToCSV("listing-generation", [row]);
    toast({ title: "Exported", description: "Listing exported to CSV." });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Listing Generator</h1>
        <p className="text-muted-foreground mt-1.5">
          Generate a complete, keyword-optimized eBay listing in seconds.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Input Form */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Input Details</CardTitle>
            <CardDescription>Enter basic info to generate a full listing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name / Keywords</Label>
              <div className="transition-transform duration-150 focus-within:scale-[1.01]">
                <Input
                  id="productName"
                  placeholder="e.g. Sony Walkman WM-FX281"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary/40"
                  data-testid="input-product-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Raw Notes (Optional)</Label>
              <div className="transition-transform duration-150 focus-within:scale-[1.005]">
                <Textarea
                  id="description"
                  placeholder="e.g. Tested works great, small scratch on back, no headphones"
                  className="h-28 resize-none transition-all focus:ring-2 focus:ring-primary/40"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger data-testid="select-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full"
                onClick={handleGenerate}
                data-testid="button-generate"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Listing
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        {/* eBay-style Preview Card */}
        <AnimatePresence mode="wait">
          {results ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Action buttons */}
              <div className="flex gap-2 justify-end flex-wrap">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnhanceWithAi}
                    disabled={enhancing}
                    data-testid="button-ai-enhance"
                  >
                    {enhancing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {aiEnhanced ? "Enhance Again" : "Enhance with AI"}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    data-testid="button-copy-all"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copy All
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    data-testid="button-export"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </motion.div>
              </div>

              {/* eBay Listing Preview */}
              <Card className="bg-card border-border overflow-hidden">
                {/* Header bar simulating eBay listing top */}
                <div className="bg-primary/10 border-b border-border px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      eBay Listing Preview
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">Top Rated</span>
                  </div>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Title + char count */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-bold leading-tight flex-1">
                        {results.optimizedTitle}
                      </h2>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCopy(results.optimizedTitle, "Title")}
                        className="text-muted-foreground hover:text-foreground mt-0.5 flex-shrink-0"
                        data-testid="button-copy-title"
                      >
                        {copiedSection === "Title" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                    <CharCount value={results.optimizedTitle} />
                  </div>

                  {/* Condition + pricing note (FlipKit has no market data, so it
                      never invents a price — pricing is the seller's call) */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                      {results.specifics.Condition}
                    </Badge>
                    {aiEnhanced && (
                      <Badge className="bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30 text-xs">
                        AI-enhanced draft — review before posting
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      No price suggested — FlipKit has no live market data.{" "}
                      <Link href="/pricing" className="underline text-primary">
                        Price it with the Pricing Calculator
                      </Link>
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/60" />

                  {/* Description bullets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Item Description
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          handleCopy(
                            results.bulletPoints.map((b) => `• ${b}`).join("\n"),
                            "Description"
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedSection === "Description" ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </motion.button>
                    </div>
                    <ul className="space-y-1.5">
                      {results.bulletPoints.map((bullet, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex gap-2 text-sm"
                        >
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>{bullet}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/60" />

                  {/* Shipping + Item Specifics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Shipping
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-green-500">FREE Standard Shipping</p>
                        <p className="text-muted-foreground text-xs">Ships within 1 business day</p>
                        <p className="text-muted-foreground text-xs">Returns accepted · 30 days</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Item Specifics
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handleCopy(
                              Object.entries(results.specifics)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join("\n"),
                              "Specifics"
                            )
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedSection === "Specifics" ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </motion.button>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(results.specifics).map(([key, value]) => (
                          <div key={key} className="flex gap-1.5 text-xs">
                            <span className="text-muted-foreground min-w-12">{key}:</span>
                            <span className="font-medium truncate">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/60" />

                  {/* Category suggestions */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Category Suggestions
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {results.categorySuggestions.map((c, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-72 rounded-lg border border-dashed border-border text-center p-8"
            >
              <Wand2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                Your eBay listing preview will appear here
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1.5">
                Enter a product name and click Generate
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
