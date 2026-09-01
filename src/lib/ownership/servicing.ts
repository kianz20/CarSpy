import { WORKSHOP_LABOUR_RATE_PER_HOUR } from "./constants";

/**
 * Itemized servicing/wear-and-tear cost model. Previously this lumped
 * everything into one "parts" bucket per powertrain, which quietly excluded
 * tyres and brakes altogether — the two biggest wear items an owner actually
 * pays for. Those wear by distance, not calendar time, so they're prorated
 * over km driven rather than bundled into the annual service visit.
 */

export type ServicingEstimate = {
  /** Full ownership-period total (the per-year items below, × ownershipYears). */
  total: number;
  /** Per-year figures — tyres/brakes are distance-based, annualized via annualKm
   * rather than lumped as a step function at the replacement point. */
  perYear: {
    /** Annual visit: labour + minor consumables (air/cabin filter, wipers, fluid top-ups). */
    scheduledService: number;
    /** $0 for pure EVs — no engine oil to change. */
    oilFilter: number;
    tyres: number;
    brakes: number;
  };
};

export const SERVICE_HOURS_BY_POWERTRAIN: Record<string, number> = {
  ev: 1,
  hybrid: 1.5,
  phev: 1.5,
  petrol: 1.5,
  diesel: 2, // more fluid/filter changes (fuel, air, sometimes DPF-related items)
};
export const DEFAULT_SERVICE_HOURS = 1.5;

export const SERVICE_MINOR_PARTS_COST_BY_POWERTRAIN: Record<string, number> = {
  ev: 60,
  hybrid: 65,
  phev: 70,
  petrol: 60,
  diesel: 70,
};
export const DEFAULT_SERVICE_MINOR_PARTS_COST = 60;

// Not applicable to pure EVs — no engine oil.
export const OIL_FILTER_COST_BY_POWERTRAIN: Record<string, number> = {
  hybrid: 130,
  phev: 140,
  petrol: 120,
  diesel: 160,
};

// Full set of 4, fitted. Bigger/heavier vehicles need bigger, pricier tyres.
export const TYRE_SET_COST_BY_BODY_TYPE: Record<string, number> = {
  hatch: 650,
  sedan: 680,
  wagon: 720,
  suv: 850,
  ute: 950,
  van: 980,
  people_mover: 820,
  coupe: 750,
  convertible: 750,
};
export const DEFAULT_TYRE_SET_COST = 750;
export const TYRE_REPLACEMENT_INTERVAL_KM = 50000;

// Pads front + rear, combined, per job.
export const BRAKE_JOB_COST = 280;
export const BRAKE_INTERVAL_KM_BASE = 40000;
// EVs/hybrids lean on regenerative braking, so pads last considerably longer.
export const BRAKE_INTERVAL_MULTIPLIER_BY_POWERTRAIN: Record<string, number> = {
  ev: 1.6,
  hybrid: 1.3,
  phev: 1.3,
};

export function estimateServicingCost(
  powertrain: string | undefined,
  bodyType: string | undefined,
  annualKm: number,
  ownershipYears: number,
): ServicingEstimate {
  const hours = (powertrain ? SERVICE_HOURS_BY_POWERTRAIN[powertrain] : undefined) ?? DEFAULT_SERVICE_HOURS;
  const minorParts = (powertrain ? SERVICE_MINOR_PARTS_COST_BY_POWERTRAIN[powertrain] : undefined) ?? DEFAULT_SERVICE_MINOR_PARTS_COST;
  const scheduledService = hours * WORKSHOP_LABOUR_RATE_PER_HOUR + minorParts;

  const oilFilterUnitCost = (powertrain ? OIL_FILTER_COST_BY_POWERTRAIN[powertrain] : undefined) ?? OIL_FILTER_COST_BY_POWERTRAIN.petrol;
  const oilFilter = powertrain === "ev" ? 0 : oilFilterUnitCost;

  const tyreSetCost = (bodyType ? TYRE_SET_COST_BY_BODY_TYPE[bodyType] : undefined) ?? DEFAULT_TYRE_SET_COST;
  const tyres = (tyreSetCost / TYRE_REPLACEMENT_INTERVAL_KM) * annualKm;

  const brakeIntervalKm = BRAKE_INTERVAL_KM_BASE * (powertrain ? (BRAKE_INTERVAL_MULTIPLIER_BY_POWERTRAIN[powertrain] ?? 1) : 1);
  const brakes = (BRAKE_JOB_COST / brakeIntervalKm) * annualKm;

  const totalPerYear = scheduledService + oilFilter + tyres + brakes;

  return {
    total: totalPerYear * ownershipYears,
    perYear: { scheduledService, oilFilter, tyres, brakes },
  };
}
