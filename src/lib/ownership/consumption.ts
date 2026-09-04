/**
 * Fuel/energy consumption estimates by body type + powertrain, in L/100km
 * (petrol/diesel/hybrid), kWh/100km (EV), or a blended L/100km-equivalent for
 * the petrol portion of a PHEV's driving. These are published-fleet-average
 * ballparks (manufacturer combined-cycle figures skew optimistic vs. real-world
 * use), not per-model figures — a bracket estimate like servicing/insurance/repairs.
 *
 * Callers that have a real per-variant figure from vehicleSpecs (curated from
 * VEEEL/fuelsaver.govt.nz — see vehicleSpecMatch.ts and seedVehicleSpecs.ts)
 * should pass it as matchedFuelEconomyL100km, which takes priority over the
 * bracket below. Only ~150 popular make/model/powertrain combos are seeded,
 * so most listings still fall through to the bracket.
 *
 * The petrol/diesel bracket is additionally nudged by the listing's own
 * engine displacement when known (see adjustForEngineSize below) — a body
 * type alone conflates, say, a base 2.0L SUV with a 3.5L V6 version of the
 * same body type, and engine size is a real, listing-specific signal we
 * already scrape rather than another bracket guess.
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

// The displacement (litres) each body-type bracket above was implicitly
// calibrated around — i.e. what a "typical" example of that body type has.
// Used to scale the bracket up/down when the actual listing's engine is
// bigger/smaller than that, rather than replacing the bracket outright.
const REFERENCE_ENGINE_LITRES_BY_BODY_TYPE: Record<string, number> = {
  hatch: 1.6,
  sedan: 2.0,
  wagon: 2.0,
  suv: 2.5,
  ute: 2.8,
  van: 2.5,
  people_mover: 2.4,
  coupe: 2.0,
  convertible: 2.0,
};
const DEFAULT_REFERENCE_ENGINE_LITRES = 2.0;

// Consumption doesn't scale perfectly linearly with displacement (bigger
// engines are also often more efficient per litre than older/smaller ones),
// but linear is a reasonable bracket-level approximation — clamped so a
// data glitch (e.g. a mis-scraped "12000cc") can't send the estimate wild.
const MIN_ENGINE_SIZE_MULTIPLIER = 0.7;
const MAX_ENGINE_SIZE_MULTIPLIER = 1.6;

/** Pulls displacement in litres out of a free-text engine field (e.g.
 * "1998cc", "1991cc/155kW") — same source data as format.ts's formatEngine,
 * but returning a number for use in the multiplier below rather than a
 * display string. Fields with no "cc" figure at all (e.g. some EV listings
 * just record power, "180kW") correctly yield undefined — nothing to adjust. */
function parseEngineLitres(engine: string | undefined): number | undefined {
  const match = engine?.match(/(\d+)\s*cc/i);
  if (!match) return undefined;
  return Number(match[1]) / 1000;
}

function engineSizeMultiplier(bodyType: string | undefined, engine: string | undefined): number {
  const actualLitres = parseEngineLitres(engine);
  if (actualLitres === undefined) return 1;

  const referenceLitres = (bodyType ? REFERENCE_ENGINE_LITRES_BY_BODY_TYPE[bodyType] : undefined) ?? DEFAULT_REFERENCE_ENGINE_LITRES;
  const rawMultiplier = actualLitres / referenceLitres;
  return Math.min(Math.max(rawMultiplier, MIN_ENGINE_SIZE_MULTIPLIER), MAX_ENGINE_SIZE_MULTIPLIER);
}

// Hybrids roughly halve petrol consumption vs. their equivalent ICE body type.
const HYBRID_MULTIPLIER = 0.55;

// A hybrid's petrol engine mostly just drives the generator/assists the electric
// motor, so a bigger displacement doesn't blow out fuel burn the way it does in
// a pure ICE — the electric motor and regen braking absorb most of that. Only
// let engine size nudge the hybrid estimate by a fraction of the ICE adjustment.
const HYBRID_ENGINE_SIZE_DAMPING = 0.15;

function dampenedMultiplier(multiplier: number, damping: number): number {
  return 1 + (multiplier - 1) * damping;
}

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

export function estimateConsumption(
  bodyType: string | undefined,
  powertrain: string | undefined,
  engine?: string,
  // Real per-variant L/100km from vehicleSpecs (see vehicleSpecMatch.ts),
  // already resolved by the caller — when present this replaces the
  // body-type bracket outright rather than nudging it, since it's actual
  // WLTP data for this make/model rather than a fleet-average guess. Not
  // applied to EV kWh/100km — vehicleSpecs is only seeded with the L/100km
  // figure (VEEEL's EV economy isn't WLTP-comparable, per its own spec).
  matchedFuelEconomyL100km?: number,
): ConsumptionEstimate {
  if (matchedFuelEconomyL100km !== undefined && powertrain !== "ev") {
    return { litresPer100Km: matchedFuelEconomyL100km, kwhPer100Km: powertrain === "phev" ? PHEV_KWH_PER_100KM : undefined };
  }

  // Engine size only tells you anything about an ICE's petrol/diesel burn —
  // not applied to EV kWh/100km (no combustion engine) or PHEV's fixed small
  // backup-engine figure (dominated by how much it's actually driven on
  // battery vs. engine, not the engine's own displacement).
  const bracketIce = (bodyType ? PETROL_DIESEL_BY_BODY_TYPE[bodyType] : undefined) ?? DEFAULT_PETROL_DIESEL_L_PER_100KM;
  const rawEngineMultiplier = engineSizeMultiplier(bodyType, engine);
  const baseIce = bracketIce * rawEngineMultiplier;

  switch (powertrain) {
    case "ev":
      return { kwhPer100Km: (bodyType ? EV_KWH_BY_BODY_TYPE[bodyType] : undefined) ?? DEFAULT_EV_KWH_PER_100KM };
    case "phev":
      return { litresPer100Km: PHEV_L_PER_100KM, kwhPer100Km: PHEV_KWH_PER_100KM };
    case "hybrid":
      return {
        litresPer100Km:
          bracketIce * HYBRID_MULTIPLIER * dampenedMultiplier(rawEngineMultiplier, HYBRID_ENGINE_SIZE_DAMPING),
      };
    case "petrol":
    case "diesel":
    default:
      return { litresPer100Km: baseIce };
  }
}
