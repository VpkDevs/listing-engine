import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

type Template = {
  id: string;
  name: string;
  category: string;
  titleFormula: string;
  description: string;
  conditionNotes: string;
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "def-1",
    name: "Standard Electronics",
    category: "Electronics",
    titleFormula: "[Brand] [Model] [Type] [Color] - Tested & Working",
    description: "Includes: [Accessories]\nTested and verified fully functional.\nCondition: [Condition specifics]",
    conditionNotes: "Good used condition. May have minor scuffs. See photos."
  },
  {
    id: "def-2",
    name: "Vintage Clothing",
    category: "Clothing",
    titleFormula: "Vtg [Decade] [Brand] [Item] Size [Size] [Color] [Graphic]",
    description: "Pit to Pit: [Measurement]\nLength: [Measurement]\nCondition: [Condition]",
    conditionNotes: "Pre-owned vintage. No holes or tears unless noted."
  }
];

export default function TemplatesLibrary() {
  const [customTemplates, setCustomTemplates] = useLocalStorage<Template[]>("flipkit-templates", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({});
  const { toast } = useToast();

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.category) {
      toast({ title: "Error", description: "Name and Category are required", variant: "destructive" });
      return;
    }
    
    const template: Template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      category: newTemplate.category,
      titleFormula: newTemplate.titleFormula || "",
      description: newTemplate.description || "",
      conditionNotes: newTemplate.conditionNotes || ""
    };
    
    setCustomTemplates([...customTemplates, template]);
    setIsDialogOpen(false);
    setNewTemplate({});
    toast({ title: "Saved", description: "Template saved successfully." });
  };

  const handleDelete = (id: string) => {
    setCustomTemplates(customTemplates.filter(t => t.id !== id));
    toast({ title: "Deleted", description: "Template removed." });
  };

  const TemplateCard = ({ template, isCustom = false }: { template: Template, isCustom?: boolean }) => (
    <Card className="bg-card flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-1">{template.category}</CardDescription>
          </div>
          {isCustom && (
            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(template.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Title Formula</div>
          <div className="text-sm font-mono bg-muted/30 p-2 rounded">{template.titleFormula}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</div>
          <div className="text-sm font-mono bg-muted/30 p-2 rounded whitespace-pre-wrap">{template.description}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates Library</h1>
          <p className="text-muted-foreground mt-2">Manage your listing formulas and text snippets.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Custom Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value={newTemplate.name || ''} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} placeholder="e.g. Media Mail Books" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={newTemplate.category || ''} onChange={e => setNewTemplate({...newTemplate, category: e.target.value})} placeholder="e.g. Books" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title Formula</Label>
                <Input value={newTemplate.titleFormula || ''} onChange={e => setNewTemplate({...newTemplate, titleFormula: e.target.value})} placeholder="[Title] by [Author] [Format]" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Description Template</Label>
                <Textarea value={newTemplate.description || ''} onChange={e => setNewTemplate({...newTemplate, description: e.target.value})} placeholder="Condition details here..." className="font-mono text-sm h-24" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveTemplate}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Pre-built Templates
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEFAULT_TEMPLATES.map(t => <TemplateCard key={t.id} template={t} />)}
        </div>
      </div>

      {customTemplates.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-xl font-semibold">My Custom Templates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTemplates.map(t => <TemplateCard key={t.id} template={t} isCustom />)}
          </div>
        </div>
      )}
    </div>
  );
}