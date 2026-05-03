import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ListTree, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { optimizeTitle } from "@/lib/generators";
import { exportToCSV } from "@/lib/csvExport";

function CharBar({ length, max = 80 }: { length: number; max?: number }) {
  const pct = Math.min((length / max) * 100, 100);
  const color =
    length > 75
      ? "bg-red-500"
      : length >= 65
      ? "bg-amber-400"
      : "bg-green-500";
  const textColor =
    length > 75
      ? "text-red-500"
      : length >= 65
      ? "text-amber-400"
      : "text-green-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
      <span className={`text-[11px] font-mono w-12 text-right ${textColor}`}>
        {length}/{max}
      </span>
    </div>
  );
}

function bumpStatsTitles(count: number) {
  const prev = Number(localStorage.getItem("flipkit-stats-titles") || 0);
  localStorage.setItem("flipkit-stats-titles", String(prev + count));
  window.dispatchEvent(new Event("flipkit-stats-updated"));
}

export default function BulkOptimizer() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<{ original: string; optimized: string }[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { toast } = useToast();

  const lines = useMemo(
    () => input.split("\n").filter((l) => l.trim().length > 0),
    [input]
  );

  const allLines = useMemo(
    () => input.split("\n"),
    [input]
  );

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
    const processed = lines.map((line) => ({
      original: line,
      optimized: optimizeTitle(line),
    }));
    setResults(processed);
    bumpStatsTitles(processed.length);
    toast({ title: "Done!", description: `Optimized ${processed.length} title${processed.length > 1 ? "s" : ""}.` });
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const text = results.map((r) => r.optimized).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "All optimized titles copied." });
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
          <p className="text-muted-foreground mt-1.5">
            Optimize up to 50 eBay titles at once — real-time character tracking.
          </p>
        </div>
        {results.length > 0 && (
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" onClick={handleCopyAll} data-testid="button-copy-all">
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" onClick={handleExportCSV} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Input panel */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Raw Titles</CardTitle>
                <CardDescription>Paste one title per line.</CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "font-mono text-xs",
                  isOverLimit ? "bg-destructive/15 text-destructive border-destructive/30" : ""
                )}
              >
                {lines.length} / 50
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-sm h-52 resize-none transition-all focus:ring-2 focus:ring-primary/40"
              placeholder={"Vintage Sony Walkman Cassette Player\nNike Mens Shoes Size 10 Blue\nVTG 90s Nintendo Game Boy Pocket..."}
              data-testid="input-bulk-titles"
            />

            {/* Live per-line char preview */}
            {input.trim().length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Live character count
                </p>
                {allLines.map((line, i) => {
                  if (!line.trim()) return null;
                  return (
                    <div key={i} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="text-primary/60 mr-1">#{i + 1}</span>
                        {line}
                      </p>
                      <CharBar length={line.length} />
                    </div>
                  );
                })}
              </div>
            )}

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleOptimize}
                disabled={isOverLimit || lines.length === 0}
                className="w-full"
                data-testid="button-optimize"
              >
                <ListTree className="w-4 h-4 mr-2" />
                Optimize All {lines.length > 0 ? `(${lines.length})` : ""}
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        {/* Results panel */}
        <div className="space-y-3">
          <AnimatePresence>
            {results.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border text-center p-6"
              >
                <ListTree className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Optimized titles will appear here
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Green = good length, Yellow = warning, Red = too long
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {results.length > 0 && (
            <p className="text-sm font-medium text-muted-foreground">
              {results.length} title{results.length > 1 ? "s" : ""} optimized
            </p>
          )}

          <div className="space-y-3">
            {results.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
              >
                <Card className="bg-card border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    {/* Original */}
                    <div className="p-3 bg-muted/20">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                        Original · {result.original.length} chars
                      </p>
                      <p className="text-sm font-mono text-muted-foreground leading-snug">
                        {result.original}
                      </p>
                    </div>
                    {/* Optimized */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-[11px] text-primary uppercase tracking-wide font-semibold">
                          Optimized
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy(result.optimized, i)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`button-copy-${i}`}
                        >
                          {copiedIdx === i ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </motion.button>
                      </div>
                      <p className="text-sm font-mono leading-snug mb-2">{result.optimized}</p>
                      <CharBar length={result.optimized.length} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
