import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { optimizeTitle } from "@/lib/generators";
import { exportToCSV } from "@/lib/csvExport";

export default function BulkOptimizer() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<{ original: string, optimized: string }[]>([]);
  const { toast } = useToast();

  const lines = input.split('\n').filter(l => l.trim().length > 0);
  const isOverLimit = lines.length > 50;

  const handleOptimize = () => {
    if (lines.length === 0) {
      toast({ title: "Error", description: "Please enter at least one title", variant: "destructive" });
      return;
    }
    if (isOverLimit) {
      toast({ title: "Limit Exceeded", description: "Maximum 50 titles at once", variant: "destructive" });
      return;
    }

    const processed = lines.map(line => ({
      original: line,
      optimized: optimizeTitle(line)
    }));
    
    setResults(processed);
    toast({ title: "Success", description: `Optimized ${processed.length} titles.` });
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    exportToCSV("bulk-optimized-titles", results);
    toast({ title: "Exported", description: "Titles exported to CSV." });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Title Optimizer</h1>
          <p className="text-muted-foreground mt-2">Clean up and optimize up to 50 titles at once.</p>
        </div>
        {results.length > 0 && (
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card className="bg-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Raw Titles</CardTitle>
              <CardDescription>Paste one title per line.</CardDescription>
            </div>
            <Badge variant="secondary" className={isOverLimit ? "bg-destructive text-destructive-foreground" : ""}>
              {lines.length} / 50 lines
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-sm h-48"
            placeholder="Vintage Sony Walkman Cassette Player&#10;Nike Mens Shoes Size 10 Blue&#10;..."
            data-testid="input-bulk-titles"
          />
          <Button 
            onClick={handleOptimize} 
            disabled={isOverLimit || lines.length === 0}
            className="w-full"
            data-testid="button-optimize"
          >
            <ListTree className="w-4 h-4 mr-2" />
            Optimize All
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="space-y-3">
            {results.map((result, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                key={i}
              >
                <Card className="bg-card border-border overflow-hidden">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    <div className="p-4 bg-muted/20">
                      <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                        <span>Original</span>
                        <span>{result.original.length} chars</span>
                      </div>
                      <p className="text-sm font-mono text-muted-foreground">{result.original}</p>
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-primary mb-1 flex justify-between">
                        <span className="font-semibold">Optimized</span>
                        <span className={
                          result.optimized.length > 75 ? "text-destructive" :
                          result.optimized.length >= 65 ? "text-amber-500" :
                          "text-green-500"
                        }>{result.optimized.length} chars</span>
                      </div>
                      <p className="text-sm font-mono">{result.optimized}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}