import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { dealers } from "../db/schema";
import { checkRobotsAllowed } from "../lib/crawler/robots";
import { crawlMotorcentralDealer } from "../lib/crawler/adapters/motorcentral";
import { crawlCarUpdaterDealer } from "../lib/crawler/adapters/carupdater";
import { crawlAdTorqueEdgeDealer } from "../lib/crawler/adapters/adtorqueedge";
import { crawlTurnersDealer } from "../lib/crawler/adapters/turners";
import { crawlTwoCheapCarsDealer } from "../lib/crawler/adapters/twocheapcars";
import { crawlArmstrongsDealer } from "../lib/crawler/adapters/armstrongs";
import { ingestDealerListings, getExistingExternalIds } from "../lib/crawler/ingest";
import { mapWithConcurrency } from "../lib/crawler/concurrency";
import type { NormalizedListing } from "../lib/crawler/types";

/**
 * Crawls every active dealer with a known adapter. This is the piece that
 * would eventually run on a schedule per PLAN.md §4 ("Background jobs");
 * for now it's invoked manually via `npm run crawl`.
 *
 * Dealers are processed concurrently, not one at a time — each dealer hits
 * a completely different server, so there's no politeness reason to make
 * one dealer wait for another to finish (unlike the request-level
 * concurrency caps inside each adapter, which bound load on a single site).
 */
// Each dealer hits a completely different domain, so this is really "how
// many independent network round-trips can be in flight at once" rather than
// load on any single site — the per-site politeness caps live inside each
// adapter instead (DETAIL_FETCH_CONCURRENCY etc). 32 of the 41 active dealers
// are on Motorcentral, mostly small independent yards with a few hundred
// listings each, not the two-adapter-thousand-listing chains — so most waves
// finish quickly and the old cap of 6 just added idle waves waiting on
// nothing in particular.
const DEALER_CONCURRENCY = 16;

type Adapter = (baseUrl: string, existingExternalIds: Set<string>) => Promise<NormalizedListing[]>;

// Each platform's listing entry point differs, so the robots.txt check
// (which must happen per-dealer, not per-platform — see PLAN.md §3c) needs
// to know which path it's actually about to crawl.
const PLATFORMS: Record<string, { adapter: Adapter; listingsPath: string }> = {
  motorcentral: { adapter: crawlMotorcentralDealer, listingsPath: "/vehicles" },
  carupdater: { adapter: crawlCarUpdaterDealer, listingsPath: "/pre-owned/" },
  adtorque_edge: { adapter: crawlAdTorqueEdgeDealer, listingsPath: "/stock/list-all?condition=Used" },
  turners: { adapter: crawlTurnersDealer, listingsPath: "/Cars/Used-Cars-for-Sale/" },
  // Crawls the dedicated inventory sitemap, not a search/listing page — see
  // twocheapcars.ts for why (their robots.txt disallows the search UI but
  // explicitly maintains this sitemap as the intended crawl path).
  twocheapcars: { adapter: crawlTwoCheapCarsDealer, listingsPath: "/sitemap-inventory.xml" },
  // Crawls a public raw-data JSON export, not a page at all — see armstrongs.ts.
  armstrongs: { adapter: crawlArmstrongsDealer, listingsPath: "/content/json/vehicles.json" },
};

async function crawlOneDealer(dealer: typeof dealers.$inferSelect) {
  const platformConfig = dealer.platform ? PLATFORMS[dealer.platform] : undefined;
  if (!platformConfig) {
    console.log(`[skip] ${dealer.name} — no adapter for platform "${dealer.platform}"`);
    return;
  }
  const { adapter, listingsPath } = platformConfig;

  const listingsUrl = `${dealer.url}${listingsPath}`;
  const robotsCheck = await checkRobotsAllowed(listingsUrl);
  if (!robotsCheck.allowed) {
    console.log(`[skip] ${dealer.name} — ${robotsCheck.reason}`);
    return;
  }

  console.log(`[crawl] ${dealer.name} (${dealer.platform}) — ${robotsCheck.reason}`);
  try {
    const existingExternalIds = await getExistingExternalIds(dealer.id);
    const scraped = await adapter(dealer.url, existingExternalIds);
    const summary = await ingestDealerListings(dealer.id, scraped);
    console.log(
      `[done] ${dealer.name} — scraped ${scraped.length}, created ${summary.created}, updated ${summary.updated}, ` +
        `price changes ${summary.priceChanges}, unconfirmed ${summary.markedUnconfirmed}, delisted ${summary.markedDelisted}`,
    );
  } catch (err) {
    console.error(`[error] ${dealer.name} —`, err);
  }
}

async function run() {
  const activeDealers = await db.select().from(dealers).where(eq(dealers.active, true));
  await mapWithConcurrency(activeDealers, DEALER_CONCURRENCY, crawlOneDealer);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
