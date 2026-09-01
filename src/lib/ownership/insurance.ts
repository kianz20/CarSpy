import { AVERAGE_ANNUAL_COMPREHENSIVE_PREMIUM, AVERAGE_ANNUAL_TPFT_PREMIUM } from "./constants";

/**
 * Insurance cost bracket model — formula-based, not a live quote. PLAN.md
 * §3/§7 flagged live insurer quote scraping as likely only partially
 * automatable (quote forms need DOB/address/driving history to price a real
 * premium), so this uses a published national-average premium (Quashed Q2
 * 2026 index for comprehensive; a derived ratio off that for TPFT — see
 * constants.ts) scaled by how the listing's price compares to a
 * representative insured value. Square-root scaling, not linear — insurance
 * cost rises with vehicle value but sub-linearly (a $60k car isn't 4x the
 * premium of a $15k car; higher-value cover has a bigger fixed-cost
 * component: base liability/theft/glass risk).
 */

export type InsuranceCoverType = "comprehensive" | "third_party_fire_theft" | "none";

const REFERENCE_INSURED_VALUE = 25000; // roughly the average used-car price this model expects to see

const COVER_TYPE_CONFIG: Record<InsuranceCoverType, { averageAnnualPremium: number; minAnnualPremium: number; maxAnnualPremium: number }> = {
  // Even a cheap car carries base liability/theft/glass risk (min), and the
  // max guards against unrealistic bracket blowup on very high-value listings
  // (our crawled data does include real six-figure exotics).
  comprehensive: { averageAnnualPremium: AVERAGE_ANNUAL_COMPREHENSIVE_PREMIUM, minAnnualPremium: 500, maxAnnualPremium: 8000 },
  // TPFT doesn't cover the insured's own vehicle for at-fault damage, so its
  // floor/ceiling are lower — there's less value-at-risk driving the premium.
  third_party_fire_theft: { averageAnnualPremium: AVERAGE_ANNUAL_TPFT_PREMIUM, minAnnualPremium: 250, maxAnnualPremium: 4000 },
  // "None" is a deliberate what-if — going uninsured is legal in NZ (unlike
  // AU/UK) but leaves the buyer exposed to the car's own repair/replacement
  // cost and any at-fault liability. Zero premium either way.
  none: { averageAnnualPremium: 0, minAnnualPremium: 0, maxAnnualPremium: 0 },
};

export function estimateAnnualInsurancePremium(price: number, coverType: InsuranceCoverType = "comprehensive"): number {
  const { averageAnnualPremium, minAnnualPremium, maxAnnualPremium } = COVER_TYPE_CONFIG[coverType];
  const scaled = averageAnnualPremium * Math.sqrt(price / REFERENCE_INSURED_VALUE);
  return Math.min(Math.max(scaled, minAnnualPremium), maxAnnualPremium);
}
