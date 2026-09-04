import { eq, inArray, and } from "drizzle-orm";
import { db } from "@/db/client";
import { watchlistItems, users, userSettings, listings } from "@/db/schema";
import { sendPriceDropEmail } from "@/lib/mailer";
import type { PriceDrop } from "@/lib/crawler/ingest";

/**
 * Called once per crawl run (see src/crawler/run.ts) with every price drop
 * detected across every dealer this run. For each dropped listing, emails
 * every user who (a) has it watchlisted and (b) has the global
 * emailOnPriceDropAlerts flag on (see schema.ts's userSettings — this is a
 * whole-watchlist switch, not a per-item one). One email per (user, listing)
 * pair; a failed send is logged and skipped rather than aborting the batch,
 * since the crawl itself already succeeded by this point.
 */
export async function sendPriceDropAlerts(drops: PriceDrop[]): Promise<void> {
  if (drops.length === 0) return;

  const listingIds = drops.map((d) => d.listingId);
  const dropByListingId = new Map(drops.map((d) => [d.listingId, d]));

  const watchers = await db
    .select({
      email: users.email,
      listingId: watchlistItems.listingId,
      make: listings.make,
      model: listings.model,
      year: listings.year,
    })
    .from(watchlistItems)
    .innerJoin(users, eq(watchlistItems.userId, users.id))
    .innerJoin(userSettings, eq(userSettings.userId, users.id))
    .innerJoin(listings, eq(listings.id, watchlistItems.listingId))
    .where(and(inArray(watchlistItems.listingId, listingIds), eq(userSettings.emailOnPriceDropAlerts, true)));

  if (watchers.length === 0) return;

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  for (const watcher of watchers) {
    const drop = dropByListingId.get(watcher.listingId);
    if (!drop) continue; // shouldn't happen — listingId came from the same drops list

    try {
      await sendPriceDropEmail({
        to: watcher.email,
        make: watcher.make,
        model: watcher.model,
        year: watcher.year,
        oldPrice: drop.oldPrice,
        newPrice: drop.newPrice,
        listingUrl: `${appUrl}/listing/${watcher.listingId}`,
      });
    } catch (err) {
      console.error(`[price-drop-alert] failed to email ${watcher.email} for listing ${watcher.listingId}:`, err);
    }
  }
}
