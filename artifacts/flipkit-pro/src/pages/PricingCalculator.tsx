import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { computeRecommendedPrice } from "@/lib/pricing";

export default function PricingCalculator() {
  const [buyPrice, setBuyPrice] = useState(10);
  const [ebayFeePct, setEbayFeePct] = useState(12.9);
  const [ebayFlatFee, setEbayFlatFee] = useState(0.30);
  const [shippingCost, setShippingCost] = useState(5);
  const [paymentFeePct, setPaymentFeePct] = useState(2.9);
  const [targetMargin, setTargetMargin] = useState(30);

  // Math lives in @/lib/pricing (unit-tested) — this page only renders it.
  const result = computeRecommendedPrice({
    buyPrice,
    shippingCost,
    ebayFeePct,
    ebayFlatFee,
    paymentFeePct,
    targetMarginPct: targetMargin,
  });
  const recPrice = result.recommendedPrice;
  const profit = result.profit;
  const totalFees = result.totalFees;
  const ebayFeeDollars = result.ebayFeeDollars;
  const paymentFeeDollars = result.paymentFeeDollars;
  const isInvalid = !result.valid;
  const roi = result.roi;

  const handleNum = (val: string, setter: (n: number) => void) => {
    const parsed = parseFloat(val);
    setter(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Calculator</h1>
        <p className="text-muted-foreground mt-2">Determine your optimal listing price based on target margins.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Costs & Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buy Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={buyPrice || ''} onChange={e => handleNum(e.target.value, setBuyPrice)} />
              </div>
              <div className="space-y-2">
                <Label>Shipping Cost ($)</Label>
                <Input type="number" min="0" step="0.01" value={shippingCost || ''} onChange={e => handleNum(e.target.value, setShippingCost)} />
              </div>
              <div className="space-y-2">
                <Label>eBay Fee (%)</Label>
                <Input type="number" min="0" step="0.1" value={ebayFeePct || ''} onChange={e => handleNum(e.target.value, setEbayFeePct)} />
              </div>
              <div className="space-y-2">
                <Label>eBay Flat Fee ($)</Label>
                <Input type="number" min="0" step="0.01" value={ebayFlatFee || ''} onChange={e => handleNum(e.target.value, setEbayFlatFee)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Fee (%)</Label>
                <Input type="number" min="0" step="0.1" value={paymentFeePct || ''} onChange={e => handleNum(e.target.value, setPaymentFeePct)} />
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Target Margin (%)</Label>
                <Input type="number" min="0" step="1" className="border-primary" value={targetMargin || ''} onChange={e => handleNum(e.target.value, setTargetMargin)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Live calculation based on inputs.</CardDescription>
          </CardHeader>
          <CardContent>
            {isInvalid ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                Impossible margin. Decrease your target margin or fees to make this profitable.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Recommended Price</div>
                  <div className="text-5xl font-bold text-primary">${recPrice.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/10 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground">Estimated Profit</div>
                    <div className="text-2xl font-bold text-green-500">${profit.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-muted/10 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground">Return on Investment</div>
                    <div className="text-2xl font-bold text-amber-500">{roi.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fee Breakdown</h4>
                  <div className="flex justify-between text-sm">
                    <span>eBay Category Fee</span>
                    <span>${ebayFeeDollars.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Processing</span>
                    <span>${paymentFeeDollars.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Fees</span>
                    <span className="text-destructive">-${totalFees.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}