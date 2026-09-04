import { db } from "@/db/client";
import { vehicleSpecs } from "@/db/schema";
import { newRequestId, timed } from "@/lib/logging/timing";

export type VehicleSpecRow = typeof vehicleSpecs.$inferSelect;

// vehicleSpecs is a small, manually-curated table (~150 rows — see
// seedVehicleSpecs.ts) that barely changes between requests, so it's cached
// in-memory rather than re-queried on every listing render/search. A short
// TTL rather than "forever" means a re-seed shows up without a redeploy.
let cache: { rows: VehicleSpecRow[]; loadedAt: number } | undefined;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function loadVehicleSpecs(): Promise<VehicleSpecRow[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.rows;
  const reqId = newRequestId("loadVehicleSpecs(cache miss)");
  const rows = await timed(reqId, "select * from vehicle_specs", () => db.select().from(vehicleSpecs));
  cache = { rows, loadedAt: Date.now() };
  return rows;
}

// A generation's fuel economy is fairly stable across nearby model years, so
// a spec row sourced from one particular year is still a reasonable stand-in
// for a listing a few years either side of it — better than the old
// body-type bracket even when it's not an exact year match. Beyond this gap
// it's more likely a different generation entirely (different engine/economy),
// so it's safer to fall through to the bracket estimate than to guess.
const MAX_YEAR_GAP = 6;

/**
 * Finds the best vehicleSpecs row for a listing, or undefined if nothing
 * curated matches (the caller should fall back to the body-type bracket
 * estimate in that case — see consumption.ts).
 */
export function matchVehicleSpec(
  specs: VehicleSpecRow[],
  make: string | undefined,
  model: string | undefined,
  year: number | undefined,
  powertrain: string | undefined,
): VehicleSpecRow | undefined {
  if (!make || !model) return undefined;
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  const sameModel = specs.filter((s) => s.make.toLowerCase() === makeLower && s.model.toLowerCase() === modelLower);
  if (sameModel.length === 0) return undefined;

  // Different powertrains of the same model can have very different fuel
  // economy (a Corolla petrol vs. hybrid, say) — never guess across them.
  // Only fall back to any powertrain when the listing's own is unknown,
  // since the bracket estimate this is meant to improve on is exactly as
  // much of a guess in that case anyway.
  const pool = powertrain ? sameModel.filter((s) => s.powertrain === powertrain) : sameModel;
  if (pool.length === 0) return undefined;

  if (year === undefined) return pool[0];

  let best: VehicleSpecRow | undefined;
  let bestGap = Infinity;
  for (const spec of pool) {
    const midpoint = spec.yearTo ? (spec.yearFrom + spec.yearTo) / 2 : spec.yearFrom;
    const gap = Math.abs(year - midpoint);
    if (gap < bestGap) {
      best = spec;
      bestGap = gap;
    }
  }
  return bestGap <= MAX_YEAR_GAP ? best : undefined;
}

/** vehicleSpecs.fuelEconomyL100km is a numeric column (returned as a string
 * by the driver) — this is the one place that turns it back into a number. */
export function fuelEconomyFromSpec(spec: VehicleSpecRow | undefined): number | undefined {
  return spec?.fuelEconomyL100km != null ? Number(spec.fuelEconomyL100km) : undefined;
}
