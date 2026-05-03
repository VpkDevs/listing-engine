import { useState } from "react";
import { Copy, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateConditionText } from "@/lib/generators";

const CONDITIONS = [
  "New",
  "New Other",
  "Certified Refurbished",
  "Excellent - Refurbished",
  "Very Good - Refurbished",
  "Good - Refurbished",
  "Seller Refurbished",
  "Used",
  "For Parts or Not Working"
];

const COMMON_ISSUES = [
  "Scratches", "Dents", "Missing Parts", "Cosmetic Wear", 
  "Functional Issue", "Stains", "Fading", "Tears", "Cracks"
];

export default function ConditionHelper() {
  const [condition, setCondition] = useState("Used");
  const [issues, setIssues] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const handleGenerate = () => {
    const text = generateConditionText(condition, issues, notes);
    setResult(text);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast({ title: "Copied", description: "Condition text copied to clipboard." });
  };

  const toggleIssue = (issue: string) => {
    setIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Condition Helper</h1>
        <p className="text-muted-foreground mt-2">Generate professional condition descriptions that protect you from returns.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>eBay Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Known Issues / Wear</Label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ISSUES.map(issue => (
                  <div key={issue} className="flex items-center space-x-2 bg-muted/20 p-2 rounded-md border border-border/50">
                    <Checkbox 
                      id={`issue-${issue}`} 
                      checked={issues.includes(issue)}
                      onCheckedChange={() => toggleIssue(issue)}
                    />
                    <Label htmlFor={`issue-${issue}`} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {issue}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea 
                placeholder="e.g. Needs a new belt, powers on but play button sticks." 
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleGenerate}>
              <ClipboardList className="w-4 h-4 mr-2" /> Generate Description
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={`bg-card transition-all ${result ? 'border-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Result Output</CardTitle>
                {result && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="p-4 bg-muted/30 rounded-md font-mono text-sm leading-relaxed border border-border">
                  {result}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                  <ClipboardList className="w-8 h-8 mb-3 opacity-20" />
                  <p>Fill out the details and generate to see your condition text here.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex gap-3 text-sm text-primary/80">
              <div className="text-xl">💡</div>
              <div>
                <strong>Pro Tip:</strong> Over-disclose condition issues. It's better to lose a sale because a buyer was scared away than to get a forced "Item Not as Described" return and negative feedback.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}