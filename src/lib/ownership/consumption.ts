/**
 * Fuel/energy consumption estimates by body type + powertrain, in L/100km
 * (petrol/diesel/hybrid), kWh/100km (EV), or a blended L/100km-equivalent for
 * the petrol portion of a PHEV's driving. These are published-fleet-average
 * ballparks (manufacturer combined-cycle figures skew optimistic vs. real-world
 * use), not per-model figures — Phase 4 doesn't have a per-make/model fuel
 * economy database, so this is a bracket estimate like servicing/insurance/repairs.
 */

export type ConsumptionEstimate = {
  /** L/100km for petrol/diesel/hybrid; undefined for pure EV */
  litresPer100Km?: number;
  /** kWh/100km for EV/PHEV's electric portion; undefined otherwise */
  kwhPer100Km?: number;
};

const PETROL_DIESEL_BY_BODY_TYPE: Record<string, number> = {
  hatch: 7.0,
  sedan: 7.5,
  wagon: 8.0,
  suv: 9.0,
  ute: 10.5,
  van: 11.0,
  people_mover: 10.0,
  coupe: 8.5,
  convertible: 8.5,
};
const DEFAULT_PETROL_DIESEL_L_PER_100KM = 8.5;

// Hybrids roughly halve petrol consumption vs. their equivalent ICE body type.
const HYBRID_MULTIPLIER = 0.55;

const EV_KWH_BY_BODY_TYPE: Record<string, number> = {
  hatch: 15,
  sedan: 16,
  wagon: 17,
  suv: 19,
  ute: 24,
  van: 22,
  people_mover: 20,
  coupe: 17,
  convertible: 17,
};
const DEFAULT_EV_KWH_PER_100KM = 18;

// PHEVs run mostly on their (small) battery for daily driving, with the
// engine as backup — real-world petrol use per km is much lower than a
// non-plug-in hybrid's, but non-zero over a 3-year/36,000km ownership
// horizon since the battery-only range doesn't cover every trip.
const PHEV_L_PER_100KM = 2.5;
const PHEV_KWH_PER_100KM = 12;

export function estimateConsumption(bodyType: string | undefined, powertrain: string | undefined): ConsumptionEstimate {
  const baseIce = (bodyType ? PETROL_DIESEL_BY_BODY_TYPE[bodyType] : undefined) ?? DEFAULT_PETROL_DIESEL_L_PER_100KM;

  switch (powertrain) {
    case "ev":
      return { kwhPer100Km: (bodyType ? EV_KWH_BY_BODY_TYPE[bodyType] : undefined) ?? DEFAULT_EV_KWH_PER_100KM };
    case "phev":
      return { litresPer100Km: PHEV_L_PER_100KM, kwhPer100Km: PHEV_KWH_PER_100KM };
    case "hybrid":
      return { litresPer100Km: baseIce * HYBRID_MULTIPLIER };
    case "petrol":
    case "diesel":
    default:
      return { litresPer100Km: baseIce };
  }
}
