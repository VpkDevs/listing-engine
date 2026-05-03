import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, Wand2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateListing } from "@/lib/generators";
import { exportToCSV } from "@/lib/csvExport";

export default function ListingGenerator() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<ReturnType<typeof generateListing> | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!productName) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    const generated = generateListing(productName, description);
    setResults(generated);
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({ title: "Copied!", description: `Copied ${section} to clipboard.` });
  };

  const handleExportCSV = () => {
    if (!results) return;
    const row = {
      Title: results.optimizedTitle,
      Brand: results.specifics.Brand,
      Model: results.specifics.Model,
      Condition: results.specifics.Condition,
      MPN: results.specifics.MPN,
      UPC: results.specifics.UPC,
      Description: results.bulletPoints.join(" | "),
      PriceLow: results.priceRange.low,
      PriceMid: results.priceRange.mid,
      PriceHigh: results.priceRange.high,
    };
    exportToCSV("listing-generation", [row]);
    toast({ title: "Exported", description: "Listing exported to CSV." });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Listing Generator</h1>
        <p className="text-muted-foreground mt-2">Generate optimized eBay listings in seconds.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Input Details</CardTitle>
            <CardDescription>Enter basic info to generate a full listing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name / Keywords</Label>
              <Input
                id="productName"
                placeholder="e.g. Sony Walkman WM-FX281"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                data-testid="input-product-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Raw Notes (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g. Tested works great, small scratch on back, no headphones"
                className="h-32 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleGenerate}
              data-testid="button-generate"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Listing
            </Button>
          </CardContent>
        </Card>

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleExportCSV} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <Card className="bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Optimized Title</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={
                          results.optimizedTitle.length > 75 ? "text-destructive border-destructive" :
                          results.optimizedTitle.length >= 65 ? "text-amber-500 border-amber-500" :
                          "text-green-500 border-green-500"
                        }
                      >
                        {results.optimizedTitle.length} / 80 chars
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleCopy(results.optimizedTitle, "Title")}
                    data-testid="button-copy-title"
                  >
                    {copiedSection === "Title" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-mono text-lg">{results.optimizedTitle}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Item Specifics</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleCopy(Object.entries(results.specifics).map(([k, v]) => `${k}: ${v}`).join('\n'), "Specifics")}
                  >
                    {copiedSection === "Specifics" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                {Object.entries(results.specifics).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-xs text-muted-foreground uppercase">{key}</div>
                    <div className="font-medium">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Description</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleCopy(results.bulletPoints.map(b => `• ${b}`).join('\n'), "Description")}
                  >
                    {copiedSection === "Description" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {results.bulletPoints.map((bullet, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pricing Suggestion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">${results.priceRange.mid}</span>
                    <span className="text-xs text-muted-foreground">
                      ${results.priceRange.low} - ${results.priceRange.high}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {results.categories.map((c, i) => (
                    <div key={i} className="text-xs truncate" title={c.name}>
                      <span className="text-muted-foreground mr-1">#{c.id}</span>
                      {c.name}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}