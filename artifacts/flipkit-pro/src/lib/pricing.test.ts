import { describe, it, expect } from "vitest";
import { computeRecommendedPrice, computeSaleProfit } from "./pricing";

describe("computeRecommendedPrice", () => {
  it("matches a hand-checked price for the default fee model", () => {
    // Buy $10, shipping $5, eBay 12.9% + $0.30, payment 2.9%, target margin 30%
    // price = (10 + 5 + 0.30) / (1 - 0.129 - 0.029 - 0.30) = 15.30 / 0.542 = 28.2287...
    const r = computeRecommendedPrice({
      buyPrice: 10,
      shippingCost: 5,
      ebayFeePct: 12.9,
      ebayFlatFee: 0.3,
      paymentFeePct: 2.9,
      targetMarginPct: 30,
    });
    expect(r.valid).toBe(true);
    expect(r.recommendedPrice).toBeCloseTo(28.2287, 3);
    // Profit should equal 30% of the recommended price (the target margin).
    expect(r.profit).toBeCloseTo(r.recommendedPrice * 0.3, 6);
    expect(r.ebayFeeDollars).toBeCloseTo(r.recommendedPrice * 0.129 + 0.3, 6);
    expect(r.paymentFeeDollars).toBeCloseTo(r.recommendedPrice * 0.029, 6);
    expect(r.totalFees).toBeCloseTo(r.ebayFeeDollars + r.paymentFeeDollars, 6);
    expect(r.roi).toBeCloseTo((r.profit / 10) * 100, 6);
  });

  it("flags an impossible margin instead of returning a nonsense price", () => {
    const r = computeRecommendedPrice({
      buyPrice: 10,
      shippingCost: 5,
      ebayFeePct: 12.9,
      ebayFlatFee: 0.3,
      paymentFeePct: 2.9,
      targetMarginPct: 90, // 12.9 + 2.9 + 90 > 100
    });
    expect(r.valid).toBe(false);
    expect(r.recommendedPrice).toBe(0);
  });

  it("handles a zero buy price without dividing by zero on ROI", () => {
    const r = computeRecommendedPrice({
      buyPrice: 0,
      shippingCost: 5,
      ebayFeePct: 12.9,
      ebayFlatFee: 0.3,
      paymentFeePct: 2.9,
      targetMarginPct: 30,
    });
    expect(r.valid).toBe(true);
    expect(r.roi).toBe(0);
  });
});

describe("computeSaleProfit", () => {
  it("applies the default eBay fee model (12.9% + $0.30)", () => {
    const { fees, profit } = computeSaleProfit({ sellPrice: 100, buyPrice: 40, shippingCost: 8 });
    expect(fees).toBeCloseTo(13.2, 6);
    expect(profit).toBeCloseTo(100 - 40 - 8 - 13.2, 6);
  });

  it("allows a custom fee model", () => {
    const { fees, profit } = computeSaleProfit({
      sellPrice: 50,
      buyPrice: 20,
      shippingCost: 0,
      feePct: 10,
      flatFee: 0,
    });
    expect(fees).toBeCloseTo(5, 6);
    expect(profit).toBeCloseTo(25, 6);
  });
});
