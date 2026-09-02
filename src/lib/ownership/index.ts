import { DEFAULT_ANNUAL_KM, OWNERSHIP_PERIOD_YEARS } from "./constants";
import { estimateFinanceCost, type FinanceOptions } from "./finance";
import { estimateFuelCost } from "./fuel";
import { estimateServicingCost, type ServicingEstimate } from "./servicing";
import { estimateAnnualInsurancePremium, type InsuranceCoverType } from "./insurance";
import { estimateAnnualRepairCost } from "./repairs";
import { estimateLicensingCost } from "./licensing";

export type OwnershipCostInput = {
  make?: string;
  year?: number;
  bodyType?: string;
  powertrain?: string;
  /** Free-text engine displacement (e.g. "1998cc") — refines the body-type
   * fuel-consumption bracket when known. See consumption.ts. */
  engine?: string;
  price: number;
  /** Current odometer reading — used to flag above/below-average wear for the
   * vehicle's age in the repairs estimate. Omit if unknown. */
  mileageKm?: number;
};

export type OwnershipCostOptions = FinanceOptions & {
  annualKm?: number;
  ownershipYears?: number;
  currentYear?: number;
  /** Defaults to "comprehensive" — the average NZ buyer's choice for most
   * cars, though sub-$5k listings are more commonly insured as Third Party,
   * Fire & Theft. See insurance.ts. */
  insuranceCoverType?: InsuranceCoverType;
};

export type OwnershipCostBreakdown = {
  financeInterest: number;
  /** Amount actually financed after the deposit — $0 when the deposit
   * covers the whole price, i.e. buying outright with no loan. */
  loanAmount: number;
  fuelAndRuc: number;
  servicing: number;
  /** Itemized view of `servicing` — scheduled visits, oil & filter, tyres, brakes. */
  servicingItems: ServicingEstimate;
  insurance: number;
  insuranceCoverType: InsuranceCoverType;
  repairs: number;
  /** Registration ("rego") + WOF over the ownership period. */
  licensing: number;
  total: number;
  ownershipYears: number;
};

/**
 * Combines finance/fuel/servicing/insurance/repairs/licensing into the
 * headline "3-year ownership cost" figure (PLAN.md §1/§5). Each sub-model is
 * a pure function over listing fields + documented reference constants
 * (constants.ts) — no live per-request scraping, matching the plan's
 * cost-conscious approach.
 */
export function estimate3YearOwnershipCost(
  listing: OwnershipCostInput,
  options: OwnershipCostOptions = {},
): OwnershipCostBreakdown {
  const ownershipYears = options.ownershipYears ?? OWNERSHIP_PERIOD_YEARS;
  const annualKm = options.annualKm ?? DEFAULT_ANNUAL_KM;
  const currentYear = options.currentYear ?? new Date().getFullYear();
  const totalKm = annualKm * ownershipYears;

  const { interestPaid, loanAmount } = estimateFinanceCost(listing.price, ownershipYears * 12, options);
  const { total: fuelAndRuc } = estimateFuelCost(listing.bodyType, listing.powertrain, totalKm, listing.engine);
  const servicingItems = estimateServicingCost(listing.powertrain, listing.bodyType, annualKm, ownershipYears);
  const insuranceCoverType = options.insuranceCoverType ?? "comprehensive";
  const insurance = estimateAnnualInsurancePremium(listing.price, insuranceCoverType) * ownershipYears;
  const repairs = estimateAnnualRepairCost(listing.make, listing.year, currentYear, listing.mileageKm) * ownershipYears;
  const { total: licensing } = estimateLicensingCost(ownershipYears, listing.powertrain);

  const total = interestPaid + fuelAndRuc + servicingItems.total + insurance + repairs + licensing;

  return {
    financeInterest: interestPaid,
    loanAmount,
    fuelAndRuc,
    servicing: servicingItems.total,
    servicingItems,
    insurance,
    insuranceCoverType,
    repairs,
    licensing,
    total,
    ownershipYears,
  };
}

export * from "./constants";
export * from "./consumption";
export * from "./finance";
export * from "./fuel";
export * from "./servicing";
export * from "./insurance";
export * from "./repairs";
export * from "./licensing";
