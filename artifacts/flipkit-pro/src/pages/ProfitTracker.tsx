import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { format } from "date-fns";
import { Trash2, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/csvExport";
import { computeSaleProfit } from "@/lib/pricing";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Sale = {
  id: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  shippingCost: number;
  fees: number;
  profit: number;
  date: string;
};

const CATEGORIES = ["Electronics", "Clothing", "Collectibles", "Books", "Tools", "Other"];

/** Form state is strings (raw input values); converted to numbers on save. */
type SaleForm = {
  name: string;
  category: string;
  buyPrice: string;
  sellPrice: string;
  shippingCost: string;
};

const EMPTY_FORM: SaleForm = { name: "", category: "Electronics", buyPrice: "", sellPrice: "", shippingCost: "" };

export default function ProfitTracker() {
  const [sales, setSales] = useLocalStorage<Sale[]>("flipkit-sales", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState<SaleForm>(EMPTY_FORM);
  const { toast } = useToast();

  const handleSave = () => {
    if (!newSale.name || !newSale.sellPrice) {
      toast({ title: "Error", description: "Name and Sell Price are required", variant: "destructive" });
      return;
    }

    const buyPrice = Number(newSale.buyPrice) || 0;
    const sellPrice = Number(newSale.sellPrice);
    const shippingCost = Number(newSale.shippingCost) || 0;
    // Fee math lives in @/lib/pricing (eBay 12.9% + $0.30 default model).
    const { fees, profit } = computeSaleProfit({ sellPrice, buyPrice, shippingCost });

    const sale: Sale = {
      id: Date.now().toString(),
      name: newSale.name,
      category: newSale.category || "Other",
      buyPrice,
      sellPrice,
      shippingCost,
      fees,
      profit,
      date: new Date().toISOString(),
    };

    setSales([sale, ...sales]);
    setIsDialogOpen(false);
    setNewSale(EMPTY_FORM);
    toast({ title: "Sale Logged", description: "Successfully tracked sale." });
  };

  const handleDelete = (id: string) => {
    setSales(sales.filter(s => s.id !== id));
  };

  const handleExport = () => {
    if (!sales.length) return;
    exportToCSV("profit-tracker", sales);
    toast({ title: "Exported", description: "Sales data exported to CSV." });
  };

  // Stats
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const totalInvestment = sales.reduce((sum, s) => sum + s.buyPrice, 0);
  const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
  const avgProfit = sales.length > 0 ? totalProfit / sales.length : 0;

  // Chart data
  const chartData = sales.slice(0, 10).reverse().map(s => ({
    name: s.name.substring(0, 15) + (s.name.length > 15 ? '...' : ''),
    profit: Number(s.profit.toFixed(2))
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit Tracker</h1>
          <p className="text-muted-foreground mt-2">Log sales and track your flipping business metrics.</p>
        </div>
        <div className="flex gap-2">
          {sales.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log a New Sale</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={newSale.name || ''} onChange={e => setNewSale({...newSale, name: e.target.value})} placeholder="Vintage Sony Walkman" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newSale.category} onValueChange={v => setNewSale({...newSale, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Buy Price ($)</Label>
                    <Input type="number" min="0" step="0.01" value={newSale.buyPrice || ''} onChange={e => setNewSale({...newSale, buyPrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sell Price ($)</Label>
                    <Input type="number" min="0" step="0.01" value={newSale.sellPrice || ''} onChange={e => setNewSale({...newSale, sellPrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping ($)</Label>
                    <Input type="number" min="0" step="0.01" value={newSale.shippingCost || ''} onChange={e => setNewSale({...newSale, shippingCost: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave}>Save Sale</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalProfit.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{roi.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Profit / Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgProfit.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {sales.length > 0 && chartData.length > 0 && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Profits</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Sold For</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No sales logged yet. Start tracking!
                </TableCell>
              </TableRow>
            ) : (
              sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="text-muted-foreground">{format(new Date(sale.date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{sale.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {sale.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">${sale.sellPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold text-green-500">${sale.profit.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(sale.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}