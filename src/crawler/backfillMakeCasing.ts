import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { listings } from "../db/schema";
import { getCanonicalMakeMap, normalizeKey } from "../lib/crawler/makeCasing";

/**
 * One-off (re-runnable) backfill for makes that ended up split across
 * multiple casings before ingest.ts started converging on one (see
 * makeCasing.ts) — e.g. "TOYOTA" (Motorcentral) vs "Toyota" (everyone else)
 * showing up as two separate entries in the make dropdown/filter.
 */
async function main() {
  const canonicalMakes = await getCanonicalMakeMap();

  const distinctMakes = await db.selectDistinct({ make: listings.make }).from(listings);

  let updated = 0;
  for (const { make } of distinctMakes) {
    const canonical = canonicalMakes.get(normalizeKey(make));
    if (!canonical || canonical === make) continue;

    const result = await db
      .update(listings)
      .set({ make: canonical })
      .where(eq(listings.make, make))
      .returning({ id: listings.id });
    console.log(`"${make}" -> "${canonical}" (${result.length} listings)`);
    updated += result.length;
  }

  console.log(`Updated ${updated} listings across ${distinctMakes.length} distinct make values.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
