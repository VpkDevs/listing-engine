/**
 * Pricing math for FlipKit Pro.
 *
 * Extracted from PricingCalculator / ProfitTracker so the numbers every
 * seller sees come from one tested place instead of two inline copies.
 *
 * The recommended-price algebra:
 *   SellPrice = Buy + Shipping + (SellPrice * feePct) + flatFee
 *             + (SellPrice * paymentPct) + (SellPrice * marginPct)
 *   => SellPrice = (Buy + Shipping + flatFee) / (1 - feePct - paymentPct - marginPct)
 * If the denominator is <= 0 the margin is impossible and the result is
 * flagged invalid rather than showing a nonsense price.
 */

export const EBAY_DEFAULT_FEE_PCT = 12.9;
export const EBAY_DEFAULT_FLAT_FEE = 0.3;
export const PAYMENT_DEFAULT_FEE_PCT = 2.9;

export interface PriceInputs {
  buyPrice: number;
  shippingCost: number;
  ebayFeePct: number;
  ebayFlatFee: number;
  paymentFeePct: number;
  targetMarginPct: number;
}

export interface PriceResult {
  valid: boolean;
  recommendedPrice: number;
  profit: number;
  totalFees: number;
  ebayFeeDollars: number;
  paymentFeeDollars: number;
  roi: number;
}

const ZERO_RESULT: PriceResult = {
  valid: false,
  recommendedPrice: 0,
  profit: 0,
  totalFees: 0,
  ebayFeeDollars: 0,
  paymentFeeDollars: 0,
  roi: 0,
};

export function computeRecommendedPrice(inputs: PriceInputs): PriceResult {
  const { buyPrice, shippingCost, ebayFeePct, ebayFlatFee, paymentFeePct, targetMarginPct } =
    inputs;

  const combinedFeePct = ebayFeePct / 100 + paymentFeePct / 100;
  const marginDec = targetMarginPct / 100;
  const denominator = 1 - combinedFeePct - marginDec;

  if (!(denominator > 0)) return { ...ZERO_RESULT };

  const recommendedPrice = (buyPrice + shippingCost + ebayFlatFee) / denominator;
  const ebayFeeDollars = recommendedPrice * (ebayFeePct / 100) + ebayFlatFee;
  const paymentFeeDollars = recommendedPrice * (paymentFeePct / 100);
  const totalFees = ebayFeeDollars + paymentFeeDollars;
  const profit = recommendedPrice - buyPrice - shippingCost - totalFees;
  const roi = buyPrice > 0 ? (profit / buyPrice) * 100 : 0;

  return {
    valid: true,
    recommendedPrice,
    profit,
    totalFees,
    ebayFeeDollars,
    paymentFeeDollars,
    roi,
  };
}

export interface SaleProfitInputs {
  sellPrice: number;
  buyPrice: number;
  shippingCost: number;
  /** Marketplace fee percentage. Defaults to eBay's common 12.9%. */
  feePct?: number;
  /** Flat per-order fee. Defaults to eBay's $0.30. */
  flatFee?: number;
}

export interface SaleProfitResult {
  fees: number;
  profit: number;
}

/** Profit on one completed sale, using the tracker's standard fee model. */
export function computeSaleProfit(inputs: SaleProfitInputs): SaleProfitResult {
  const feePct = inputs.feePct ?? EBAY_DEFAULT_FEE_PCT;
  const flatFee = inputs.flatFee ?? EBAY_DEFAULT_FLAT_FEE;
  const fees = inputs.sellPrice * (feePct / 100) + flatFee;
  const profit = inputs.sellPrice - inputs.buyPrice - inputs.shippingCost - fees;
  return { fees, profit };
}
