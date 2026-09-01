import { DEFAULT_ANNUAL_KM } from "./constants";

/**
 * Reliability-adjusted repair-cost heuristic — the fuzziest input in the
 * whole model (PLAN.md §2 calls this out explicitly), so this stays a
 * bracket/modifier estimate, not a precise per-model figure. Three factors:
 * vehicle age (older cars need more unscheduled repairs, independent of
 * make), a brand-tier multiplier (European luxury marques are consistently
 * more expensive to repair per specialist labour rates + parts availability,
 * regardless of underlying reliability), and now actual mileage relative to
 * what's expected for the vehicle's age — a car with well above/below
 * average km for its age is a real, listing-visible reliability signal
 * (common with NZ's used-import market, where age and mileage often diverge)
 * that the age bracket alone doesn't capture.
 */

// Exotic/supercar marques: specialist-only servicing, scarce parts, far
// higher labour rates than a mainstream independent workshop — a different
// tier from ordinary European luxury, not just "more of the same."
const EXOTIC_MAKES = new Set(["mclaren", "ferrari", "lamborghini", "rolls-royce", "rolls royce", "bugatti", "lotus"]);

const PREMIUM_MAKES = new Set([
  "bmw",
  "mercedes-benz",
  "mercedes benz",
  "audi",
  "land rover",
  "range rover",
  "jaguar",
  "porsche",
  "volvo",
  "mini",
  "alfa romeo",
  "jeep",
  "chrysler",
  "maserati",
  "bentley",
  "aston martin",
]);

const BUDGET_RELIABLE_MAKES = new Set(["toyota", "honda", "mazda", "suzuki", "subaru", "hyundai", "kia", "mitsubishi"]);

function repairMultiplierForMake(make: string | undefined): number {
  const normalized = make?.toLowerCase();
  if (normalized && EXOTIC_MAKES.has(normalized)) return 3.5;
  if (normalized && PREMIUM_MAKES.has(normalized)) return 1.8;
  if (normalized && BUDGET_RELIABLE_MAKES.has(normalized)) return 0.8;
  return 1.0;
}

/** Base annual unscheduled-repair cost by vehicle age bracket (years since manufacture). */
function baseAnnualRepairCostForAge(ageYears: number): number {
  if (ageYears <= 3) return 150;
  if (ageYears <= 6) return 350;
  if (ageYears <= 10) return 650;
  return 1000;
}

// How far a listing's actual odometer reading sits from the "expected" km
// for its age (age × DEFAULT_ANNUAL_KM) — high-mileage-for-age cars see more
// wear-driven failures, low-mileage-for-age cars see fewer. Kept modest
// (±40% max) since this is a secondary signal on top of the age bracket, not
// a replacement for it.
const HIGH_MILEAGE_RATIO = 1.3;
const VERY_HIGH_MILEAGE_RATIO = 1.6;
const LOW_MILEAGE_RATIO = 0.7;

export function mileageRepairMultiplier(mileageKm: number | undefined, ageYears: number): number {
  if (mileageKm === undefined) return 1;
  const expectedKm = Math.max(ageYears, 1) * DEFAULT_ANNUAL_KM; // floor of 1 year avoids a divide-by-zero blowup for a brand-new car
  const ratio = mileageKm / expectedKm;
  if (ratio >= VERY_HIGH_MILEAGE_RATIO) return 1.4;
  if (ratio >= HIGH_MILEAGE_RATIO) return 1.2;
  if (ratio <= LOW_MILEAGE_RATIO) return 0.9;
  return 1;
}

export function estimateAnnualRepairCost(
  make: string | undefined,
  vehicleYear: number | undefined,
  currentYear: number,
  mileageKm: number | undefined,
): number {
  const ageYears = vehicleYear ? Math.max(currentYear - vehicleYear, 0) : 8; // assume a mid-age car if year is unknown
  return baseAnnualRepairCostForAge(ageYears) * repairMultiplierForMake(make) * mileageRepairMultiplier(mileageKm, ageYears);
}
