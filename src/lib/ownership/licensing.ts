import { ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN, WOF_INSPECTION_COST, WOF_INSPECTIONS_PER_YEAR } from "./constants";

/**
 * Vehicle licensing ("rego") + WOF — a real cost every NZ owner pays that was
 * previously missing from the model entirely. Both are flat government/
 * testing-station fees, not brackets, so this is low-uncertainty compared to
 * the repairs/insurance models.
 */
export type LicensingEstimate = {
  total: number;
  regoCost: number;
  wofCost: number;
};

export function estimateLicensingCost(ownershipYears: number, powertrain: string | undefined): LicensingEstimate {
  const annualRegoFee =
    (powertrain ? ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN[powertrain as keyof typeof ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN] : undefined) ??
    ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN.petrol;
  const regoCost = annualRegoFee * ownershipYears;
  const wofCost = WOF_INSPECTION_COST * WOF_INSPECTIONS_PER_YEAR * ownershipYears;
  return { total: regoCost + wofCost, regoCost, wofCost };
}
