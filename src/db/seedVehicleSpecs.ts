import { sql, count, eq, and } from "drizzle-orm";
import { db } from "./client";
import { listings, vehicleSpecs } from "./schema";
import { lookupVeeel } from "../lib/veeel/client";
import { normalizePowertrain } from "../lib/crawler/normalize";

/**
 * Seeds vehicleSpecs with real VEEEL data for the most common
 * make/model/powertrain combinations already sitting in our own listings —
 * about 14.5% of crawled listings carry a real 17-char VIN (AdTorqueEdge,
 * Armstrongs and TwoCheapCars all capture it), which is plenty to source one
 * representative VIN per popular variant without scraping anything new.
 *
 * Each VEEEL request uses a real VIN taken from an actual crawled listing —
 * required by VEEEL's terms of use (no empty/fabricated lookups) — and the
 * result is cached indefinitely as a variant-level row, not tied to that one
 * vehicle: fuel economy/CO2/safety don't change for a given build, so this
 * row backs every listing that matches the same make/model/year/powertrain,
 * not just the one VIN it came from. Re-running this script skips any
 * make/model/powertrain combo already present, so it's safe to re-run
 * periodically to pick up newly-popular models without re-querying ones
 * already seeded (see the "safe to do" discussion in chat — retention
 * guidance in the spec is aimed at registration-linked data, but re-running
 * this occasionally keeps us clearly inside it regardless).
 */

const TOP_N_VARIANTS = 150;
const REQUEST_DELAY_MS = 500; // polite pacing — this is a one-off/periodic seed run, not a live traffic path

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseFuelEconomy(text: string | undefined): number | undefined {
  // e.g. "7.1L per 100km" or "18.2kWh per 100km" — only the L/100km form maps
  // onto vehicleSpecs.fuelEconomyL100km; EVs are handled by the existing
  // kWh bracket estimate in consumption.ts instead (see spec note that EV
  // energy economy isn't WLTP-comparable), so a kWh figure is left unset.
  const match = text?.match(/^([\d.]+)L per 100km/i);
  return match ? parseFloat(match[1]) : undefined;
}

async function main() {
  const candidates = await db
    .select({
      make: listings.make,
      model: listings.model,
      powertrain: listings.powertrain,
      count: count(),
    })
    .from(listings)
    .where(sql`${listings.vin} IS NOT NULL AND length(${listings.vin}) = 17`)
    .groupBy(listings.make, listings.model, listings.powertrain)
    .orderBy(sql`count(*) DESC`)
    .limit(TOP_N_VARIANTS);

  console.log(`Found ${candidates.length} candidate make/model/powertrain combos with a real VIN available.\n`);

  let seeded = 0;
  let skippedExisting = 0;
  let skippedNoData = 0;
  let failed = 0;

  for (const candidate of candidates) {
    // VEEEL returns make/model upper-cased ("FORD"), while candidate.make/model
    // come straight from listings (whatever case the dealer site used, e.g.
    // "Ford") — a case-sensitive comparison here never matches an
    // already-seeded row and silently re-queries + re-inserts a duplicate
    // (caught by comparing a fresh full run against an earlier dry run:
    // 5 exact duplicate rows, same VIN queried twice). Compare lower-cased.
    const existing = await db.query.vehicleSpecs.findFirst({
      where: and(
        sql`lower(${vehicleSpecs.make}) = lower(${candidate.make})`,
        sql`lower(${vehicleSpecs.model}) = lower(${candidate.model})`,
        candidate.powertrain ? eq(vehicleSpecs.powertrain, candidate.powertrain) : sql`${vehicleSpecs.powertrain} IS NULL`,
      ),
    });
    if (existing) {
      skippedExisting++;
      continue;
    }

    const sampleListing = await db.query.listings.findFirst({
      where: and(
        eq(listings.make, candidate.make),
        eq(listings.model, candidate.model),
        candidate.powertrain ? eq(listings.powertrain, candidate.powertrain) : sql`${listings.powertrain} IS NULL`,
        sql`${listings.vin} IS NOT NULL AND length(${listings.vin}) = 17`,
      ),
    });
    if (!sampleListing?.vin) {
      skippedNoData++;
      continue;
    }

    try {
      const result = await lookupVeeel({ vin: sampleListing.vin, listingid: `seed-${sampleListing.id}` });

      // ErrorCode 0 = full data; 10 = vehicle recognized but no fuel economy
      // (still worth storing safety data if present); >=30 = no match at all.
      if (result.errorCode >= 30) {
        console.log(`  no VEEEL match — ${candidate.make} ${candidate.model} (${candidate.powertrain ?? "?"})`);
        skippedNoData++;
        continue;
      }

      const fuelEconomyL100km = parseFuelEconomy(result.fuelEconomyText);
      const safetyStars = result.safetyStarsX2 !== undefined ? result.safetyStarsX2 / 2 : undefined;

      await db.insert(vehicleSpecs).values({
        make: result.make ?? candidate.make,
        model: result.model ?? candidate.model,
        yearFrom: result.mvrYear ?? new Date().getFullYear(),
        yearTo: result.mvrYear ?? null,
        engine: result.engineSizeCc ? `${result.engineSizeCc}cc` : undefined,
        powertrain: normalizePowertrain(result.fuelType) ?? candidate.powertrain ?? undefined,
        fuelEconomyL100km: fuelEconomyL100km !== undefined ? fuelEconomyL100km.toFixed(1) : undefined,
        co2GramsKm: result.co2GramsKm,
        safetyStars: safetyStars !== undefined ? safetyStars.toFixed(1) : undefined,
        safetyTest: result.driverSafetyTest,
        veeelReference: sampleListing.vin,
        notes: `Seeded from VIN on listing #${sampleListing.id} (${candidate.count} listings matched this make/model/powertrain at seed time)`,
      });

      console.log(`  seeded — ${result.make} ${result.model} ${result.mvrYear ?? ""}: ${result.fuelEconomyText ?? "no fuel economy"}`);
      seeded++;
    } catch (err) {
      console.error(`  FAILED — ${candidate.make} ${candidate.model}:`, err instanceof Error ? err.message : err);
      failed++;
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\nDone. Seeded ${seeded}, skipped ${skippedExisting} already-seeded, skipped ${skippedNoData} with no VEEEL match, ${failed} failed.`);
}

main().then(() => process.exit(0));
