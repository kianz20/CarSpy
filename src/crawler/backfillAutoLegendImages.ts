import { eq, and, ilike } from "drizzle-orm";
import { db } from "../db/client";
import { listings, dealers } from "../db/schema";
import { fetchDetailPageData } from "../lib/crawler/adapters/motorcentral";
import { mapWithConcurrency } from "../lib/crawler/concurrency";

/**
 * One-off backfill for Auto Legend listings — their template emits two
 * og:image meta tags (a generic site-logo default, then the real vehicle
 * photo overriding it further down); the crawler's regex used to grab only
 * the first match, so every listing crawled before that fix got the logo
 * instead of its actual photo (see motorcentral.ts's og:image extraction).
 */
const FETCH_CONCURRENCY = 10;

async function main() {
  const autoLegendDealer = await db
    .select({ id: dealers.id, name: dealers.name })
    .from(dealers)
    .where(eq(dealers.name, "Auto Legend"))
    .limit(1);

  if (autoLegendDealer.length === 0) {
    console.log("Auto Legend dealer not found.");
    return;
  }

  const dealerId = autoLegendDealer[0].id;
  const rows = await db
    .select({ id: listings.id, url: listings.url })
    .from(listings)
    .where(
      and(
        ilike(listings.imageUrl, "%logo%"),
        eq(listings.dealerId, dealerId),
        eq(listings.status, "active"),
      ),
    );

  console.log(`Re-extracting image URLs for ${rows.length} Auto Legend listings...`);

  let updated = 0;
  await mapWithConcurrency(rows, FETCH_CONCURRENCY, async (row) => {
    try {
      const { imageUrl } = await fetchDetailPageData(row.url);
      if (imageUrl) {
        await db.update(listings).set({ imageUrl }).where(eq(listings.id, row.id));
        updated++;
      }
    } catch {
      // don't let one bad detail page fail the whole backfill
    }
  });

  console.log(`Updated ${updated} of ${rows.length} Auto Legend listings with images.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
