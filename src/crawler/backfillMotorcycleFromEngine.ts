import { and, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import { listings } from "../db/schema";
import { inferMotorcycleFromEngineCc } from "../lib/crawler/normalize";

/**
 * One-off (re-runnable) backfill for listings whose body type is still null
 * because the dealer's raw "Body" field is blank for motorbike/scooter/moped
 * stock (seen on a real Motorcentral listing for a 49cc moped) — normalize.ts's
 * inferMotorcycleFromEngineCc fallback only applies to listings crawled after
 * that fix landed, so already-known rows need a one-time pass using the
 * engine size already stored in the DB.
 */
async function main() {
  const rows = await db
    .select({ id: listings.id, engine: listings.engine })
    .from(listings)
    .where(and(isNull(listings.bodyType), isNotNull(listings.engine), eq(listings.status, "active")));

  console.log(`Checking engine size for ${rows.length} body-type-less listings...`);

  let updated = 0;
  for (const row of rows) {
    const bodyType = inferMotorcycleFromEngineCc(row.engine ?? undefined);
    if (bodyType) {
      await db.update(listings).set({ bodyType }).where(eq(listings.id, row.id));
      updated++;
    }
  }

  console.log(`Updated ${updated} of ${rows.length} listings.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
