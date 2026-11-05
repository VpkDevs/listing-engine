import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateKeywords } from "@/lib/generators";
import { exportToCSV } from "@/lib/csvExport";

export default function KeywordResearch() {
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState<{word: string, tier: string}[]>([]);
  const { toast } = useToast();

  const handleResearch = () => {
    if (!category) {
      toast({ title: "Error", description: "Please enter a product category", variant: "destructive" });
      return;
    }
    const results = generateKeywords(category);
    setKeywords(results.sort((a, b) => {
      const tierVal = { "Core": 3, "Supporting": 2, "Long-tail": 1 };
      return tierVal[b.tier as keyof typeof tierVal] - tierVal[a.tier as keyof typeof tierVal];
    }));
  };

  const handleCopy = () => {
    if (!keywords.length) return;
    const words = keywords.map(k => k.word).join(', ');
    navigator.clipboard.writeText(words);
    toast({ title: "Copied!", description: "Keywords copied to clipboard." });
  };

  const handleExport = () => {
    if (!keywords.length) return;
    exportToCSV("keywords", keywords);
    toast({ title: "Exported", description: "Keywords exported to CSV." });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Keyword Research</h1>
        <p className="text-muted-foreground mt-2">
          Build a starter keyword list for a product type. Tiers mark how central a phrase is —
          not search volume (FlipKit has no volume data, so refine against eBay sold listings).
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Enter a product type (e.g., 'Coffee Mugs', 'Mens Sneakers')" 
            className="pl-9"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
          />
        </div>
        <Button onClick={handleResearch}>Research Keywords</Button>
      </div>

      {keywords.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Generated Keywords</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" /> Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>
          
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                {keywords.map((kw, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-sm py-1.5 px-3 font-mono cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(kw.word);
                      toast({ title: "Copied", description: kw.word });
                    }}
                  >
                    {kw.word}
                    <span className="ml-2 text-xs opacity-70">
                      {kw.tier === 'Core' ? '🔥' : kw.tier === 'Supporting' ? '⚡' : '📊'}
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">🔥 Core phrase</span>
            <span className="flex items-center gap-1">⚡ Supporting modifier</span>
            <span className="flex items-center gap-1">📊 Long-tail phrase</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}