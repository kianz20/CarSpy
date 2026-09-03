import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { listings, dealers } from "../db/schema";
import { fetchDetailPageData } from "../lib/crawler/adapters/motorcentral";
import { mapWithConcurrency } from "../lib/crawler/concurrency";

/**
 * One-off backfill for Industry Motors listings — their listing pages load
 * images dynamically via JS, so the static crawler can't extract img src
 * from the listing card. This backfill fetches detail pages and extracts
 * images from the og:image meta tag instead.
 */
const FETCH_CONCURRENCY = 10;

async function main() {
  const industryMotorsDealer = await db
    .select({ id: dealers.id, name: dealers.name })
    .from(dealers)
    .where(eq(dealers.name, "Industry Motors"))
    .limit(1);

  if (industryMotorsDealer.length === 0) {
    console.log("Industry Motors dealer not found.");
    return;
  }

  const dealerId = industryMotorsDealer[0].id;
  const rows = await db
    .select({ id: listings.id, url: listings.url })
    .from(listings)
    .where(
      and(
        isNull(listings.imageUrl),
        eq(listings.dealerId, dealerId),
        eq(listings.status, "active"),
      ),
    );

  console.log(
    `Extracting image URLs from ${rows.length} Industry Motors listings...`,
  );

  let updated = 0;
  await mapWithConcurrency(rows, FETCH_CONCURRENCY, async (row) => {
    try {
      const { imageUrl } = await fetchDetailPageData(row.url);
      if (imageUrl) {
        await db
          .update(listings)
          .set({ imageUrl })
          .where(eq(listings.id, row.id));
        updated++;
      }
    } catch {
      // don't let one bad detail page fail the whole backfill
    }
  });

  console.log(
    `Updated ${updated} of ${rows.length} Industry Motors listings with images.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
