import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { listings, dealers } from "../db/schema";
import { fetchDetailBodyType } from "../lib/crawler/adapters/motorcentral";
import { mapWithConcurrency } from "../lib/crawler/concurrency";

/**
 * One-off (re-runnable) backfill for Motorcentral listings whose body type
 * came back unrecognized on first sighting — the regular crawl only fetches
 * a listing's detail page once, on first sighting (see motorcentral.ts's
 * cost/politeness note), so a normalize.ts fix for a previously-unrecognized
 * raw value (e.g. "Motorbike") never reaches already-known listings on its
 * own. Re-fetches just the Body field for every currently-null-body-type
 * Motorcentral listing and updates it if normalizeBodyType now resolves it.
 */
const FETCH_CONCURRENCY = 10;

async function main() {
  const rows = await db
    .select({ id: listings.id, url: listings.url })
    .from(listings)
    .innerJoin(dealers, eq(listings.dealerId, dealers.id))
    .where(and(isNull(listings.bodyType), eq(dealers.platform, "motorcentral"), eq(listings.status, "active")));

  console.log(`Re-checking body type for ${rows.length} listings...`);

  let updated = 0;
  await mapWithConcurrency(rows, FETCH_CONCURRENCY, async (row) => {
    try {
      const bodyType = await fetchDetailBodyType(row.url);
      if (bodyType) {
        await db.update(listings).set({ bodyType }).where(eq(listings.id, row.id));
        updated++;
      }
    } catch {
      // don't let one bad detail page fail the whole backfill
    }
  });

  console.log(`Updated ${updated} of ${rows.length} listings.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
