import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { listings, listingPriceHistory } from "@/db/schema";
import type { NormalizedListing } from "./types";
import { getCanonicalMakeMap, resolveMakeCasing } from "./makeCasing";

// See PLAN.md §5a: a listing missing from a crawl isn't immediately delisted
// (transient site hiccups happen) — it's marked "unconfirmed" and only
// "delisted" after this many consecutive misses (~48h at a 24h crawl cadence).
const MISSED_CRAWLS_BEFORE_DELISTED = 2;

// One multi-row upsert per this many listings, instead of one round-trip per
// listing — a large dealer (e.g. Turners at ~2,150 listings) was taking
// minutes on the DB step alone with the old one-row-at-a-time loop, entirely
// separate from crawl time. Chunked rather than a single statement for the
// biggest dealers, to keep any one query's parameter count reasonable.
const BATCH_SIZE = 500;

export type IngestSummary = {
  created: number;
  updated: number;
  priceChanges: number;
  markedUnconfirmed: number;
  markedDelisted: number;
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function ingestDealerListings(
  dealerId: number,
  scraped: NormalizedListing[],
): Promise<IngestSummary> {
  const summary: IngestSummary = {
    created: 0,
    updated: 0,
    priceChanges: 0,
    markedUnconfirmed: 0,
    markedDelisted: 0,
  };

  // Only the columns actually used below (price-change diffing, the
  // missed-crawl sweep) — pulling every column (25+, including the sizeable
  // rawJson blob) for a dealer's full existing inventory just to read four
  // fields was unnecessary DB/network cost on every crawl.
  const existing = await db
    .select({
      id: listings.id,
      externalId: listings.externalId,
      price: listings.price,
      status: listings.status,
      missedCrawls: listings.missedCrawls,
    })
    .from(listings)
    .where(eq(listings.dealerId, dealerId));
  const existingByExternalId = new Map(existing.map((row) => [row.externalId, row]));
  const seenExternalIds = new Set(scraped.map((item) => item.externalId));
  const now = new Date();

  // Different dealer platforms render the same brand with different casing
  // (Motorcentral's "TOYOTA" vs another's "Toyota") — snapping newly-scraped
  // makes to whatever's already canonical in the DB keeps the make
  // dropdown/filter from fragmenting into casing duplicates over time.
  const canonicalMakes = await getCanonicalMakeMap();

  for (const batch of chunk(scraped, BATCH_SIZE)) {
    const rows = batch.map((item) => ({
      dealerId,
      externalId: item.externalId,
      url: item.url,
      make: resolveMakeCasing(item.make, canonicalMakes),
      model: item.model,
      year: item.year,
      variant: item.variant,
      engine: item.engine,
      transmission: item.transmission,
      bodyType: item.bodyType,
      powertrain: item.powertrain,
      mileageKm: item.mileageKm,
      vin: item.vin,
      imageUrl: item.imageUrl,
      price: item.price.toFixed(2),
      status: "active" as const,
      missedCrawls: 0,
      firstSeenAt: now,
      lastSeenAt: now,
    }));

    // `xmax = 0` is a standard Postgres trick for telling a fresh INSERT
    // apart from an ON CONFLICT UPDATE within the same RETURNING clause —
    // avoids a second round-trip just to classify created vs. updated.
    const result = await db
      .insert(listings)
      .values(rows)
      .onConflictDoUpdate({
        target: [listings.dealerId, listings.externalId],
        set: {
          make: sql`excluded.make`,
          model: sql`excluded.model`,
          year: sql`excluded.year`,
          variant: sql`excluded.variant`,
          // Detail-page-only fields (see motorcentral.ts etc.) are only
          // re-fetched for genuinely new listings — coalesce so a
          // re-confirm of an already-known listing doesn't blank these out.
          engine: sql`coalesce(excluded.engine, ${listings.engine})`,
          transmission: sql`coalesce(excluded.transmission, ${listings.transmission})`,
          bodyType: sql`coalesce(excluded.body_type, ${listings.bodyType})`,
          powertrain: sql`coalesce(excluded.powertrain, ${listings.powertrain})`,
          mileageKm: sql`coalesce(excluded.mileage_km, ${listings.mileageKm})`,
          vin: sql`coalesce(excluded.vin, ${listings.vin})`,
          imageUrl: sql`coalesce(excluded.image_url, ${listings.imageUrl})`,
          price: sql`excluded.price`,
          status: "active",
          missedCrawls: 0,
          lastSeenAt: sql`excluded.last_seen_at`,
        },
      })
      .returning({
        id: listings.id,
        externalId: listings.externalId,
        price: listings.price,
        wasInserted: sql<boolean>`(xmax = 0)`,
      });

    const priceHistoryRows: { listingId: number; price: string; observedAt: Date }[] = [];
    for (const row of result) {
      if (row.wasInserted) {
        summary.created++;
        priceHistoryRows.push({ listingId: row.id, price: row.price, observedAt: now });
      } else {
        summary.updated++;
        const prior = existingByExternalId.get(row.externalId);
        if (prior && Number(prior.price) !== Number(row.price)) {
          summary.priceChanges++;
          priceHistoryRows.push({ listingId: row.id, price: row.price, observedAt: now });
        }
      }
    }

    if (priceHistoryRows.length > 0) {
      await db.insert(listingPriceHistory).values(priceHistoryRows);
    }
  }

  // Listings that existed before this crawl but weren't seen this time —
  // batched into one UPDATE per chunk via a CASE expression, rather than one
  // UPDATE per missing listing.
  const missing = existing.filter((row) => !seenExternalIds.has(row.externalId) && row.status !== "delisted");
  for (const row of missing) {
    const newMissedCrawls = row.missedCrawls + 1;
    if (newMissedCrawls >= MISSED_CRAWLS_BEFORE_DELISTED) summary.markedDelisted++;
    else summary.markedUnconfirmed++;
  }
  for (const batch of chunk(missing, BATCH_SIZE)) {
    await db
      .update(listings)
      .set({
        missedCrawls: sql`${listings.missedCrawls} + 1`,
        status: sql`case when ${listings.missedCrawls} + 1 >= ${MISSED_CRAWLS_BEFORE_DELISTED} then 'delisted' else 'unconfirmed' end`,
      })
      .where(
        inArray(
          listings.id,
          batch.map((row) => row.id),
        ),
      );
  }

  return summary;
}

export async function getExistingExternalIds(dealerId: number): Promise<Set<string>> {
  const rows = await db
    .select({ externalId: listings.externalId })
    .from(listings)
    .where(and(eq(listings.dealerId, dealerId)));
  return new Set(rows.map((r) => r.externalId));
}
