import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { watchlistItems, listings, dealers } from "@/db/schema";
import type { ListingCardData } from "@/components/listing-card";

export async function getWatchlistedListingIds(userId: number): Promise<Set<number>> {
  const rows = await db
    .select({ listingId: watchlistItems.listingId })
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, userId));
  return new Set(rows.map((r) => r.listingId));
}

export async function isListingWatchlisted(userId: number, listingId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: watchlistItems.id })
    .from(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.listingId, listingId)));
  return row !== undefined;
}

export async function addToWatchlist(userId: number, listingId: number): Promise<void> {
  // onConflictDoNothing — the unique (userId, listingId) index makes a
  // double add-click harmless rather than a thrown constraint error.
  await db.insert(watchlistItems).values({ userId, listingId }).onConflictDoNothing();
}

export async function removeFromWatchlist(userId: number, listingId: number): Promise<void> {
  await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.listingId, listingId)));
}

/** Watchlisted listings for a user, in the same shape page.tsx builds for
 * search results, so they can be rendered with the existing ListingCard. */
export async function getWatchlistListings(userId: number): Promise<ListingCardData[]> {
  const rows = await db
    .select()
    .from(watchlistItems)
    .innerJoin(listings, eq(watchlistItems.listingId, listings.id))
    .innerJoin(dealers, eq(listings.dealerId, dealers.id))
    .where(and(eq(watchlistItems.userId, userId), inArray(listings.status, ["active", "unconfirmed"])));

  return rows.map((row) => ({
    id: row.listings.id,
    url: row.listings.url,
    make: row.listings.make,
    model: row.listings.model,
    year: row.listings.year,
    variant: row.listings.variant,
    transmission: row.listings.transmission,
    bodyType: row.listings.bodyType,
    powertrain: row.listings.powertrain,
    engine: row.listings.engine,
    mileageKm: row.listings.mileageKm,
    importStatus: row.listings.importStatus,
    price: parseFloat(row.listings.price),
    dealerName: row.dealers.name,
    dealerRegion: row.dealers.region,
    imageUrl: row.listings.imageUrl,
  }));
}
