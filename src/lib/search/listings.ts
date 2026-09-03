import { and, asc, count, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { listings, dealers, vehicleModelDescriptions, listingPriceHistory } from "@/db/schema";
import { BRACKET_DEFS, type MileageBracketStat } from "./mileageStats";
import { isNationwide, NZ_REGIONS, parseDealerRegions } from "@/lib/regions";
import {
  estimate3YearOwnershipCost,
  type FinanceOptions,
  type InsuranceCoverType,
} from "@/lib/ownership";

/**
 * Structured search filters for the deal-finder, matching the dropdown/field
 * inputs from PLAN.md §2 ("Search criteria") — no free-text parsing (see
 * src/lib/taxonomy/data.ts for why dropdowns were chosen over that).
 */
export type ListingSearchFilters = {
  /** Empty/undefined array = no filter on this field, matching anything. */
  bodyType?: string[];
  powertrain?: string[];
  make?: string[];
  /** Multiple free-text terms, OR'd together (each still partial/ilike). */
  model?: string[];
  transmission?: string[];
  region?: string[];
  minPrice?: number;
  maxPrice?: number;
  maxMileageKm?: number;
  minYear?: number;
  maxYear?: number;
  /** Motorcycles/scooters are excluded from results by default (see
   * src/lib/taxonomy/data.ts's "motorcycle" body type) — most shoppers here
   * are car-shopping, and mixing in bikes muddies price/mileage comparisons.
   * Explicitly picking bodyType "motorcycle" still works regardless of this. */
  includeMotorcycles?: boolean;
};

export type ListingSort = "total" | "price" | "mileage";

/** Only needed for sort "total" — the same finance/insurance inputs page.tsx
 * feeds into estimate3YearOwnershipCost for display, so the sort order
 * matches the total-cost figure the user actually sees on each card. */
export type TotalCostSortOptions = {
  financeOptions?: FinanceOptions;
  annualKm?: number;
  insuranceCoverType?: InsuranceCoverType;
};

// A search with no filters at all matches every active listing (~9,000+ and
// growing) — rendering that in one page took 50+ seconds and looked like the
// site had hung, hence pagination rather than one giant result set.
export const PAGE_SIZE = 60;

// Hard cap on how deep pagination goes. Not just a nicety — for sort
// "total" (see below), how far a page reaches directly sets how many rows
// get fetched and costed, so an unbounded page number would make a single
// request arbitrarily expensive. 50 pages (3,000 listings deep) is already
// far past what anyone will click through in a "browse and compare" UI.
const MAX_PAGE = 50;

// See runSearchQuery's "total" branch — how many cheapest-by-price rows get
// costed and re-sorted in JS to find the cheapest-by-total page. Scales with
// how deep the requested page is (still a fixed multiple of PAGE_SIZE per
// page), not a flat constant, so later pages stay correctly ordered too.
const TOTAL_SORT_CANDIDATE_MULTIPLIER = 10;

/** Dealer.region is free text (see src/lib/regions.ts) — a dealer whose raw
 * value is e.g. "Wigram, Christchurch" or "Panmure, Auckland; Wigram,
 * Christchurch" needs to match a search for the real region ("Canterbury",
 * "Auckland") it covers, not an exact string. Resolves the search's region
 * filter to the actual raw dealer.region values that belong to it (plus any
 * "National" dealer, which covers every region). */
async function resolveRegionRawValues(regions: string[]): Promise<string[]> {
  const rows = await db.selectDistinct({ region: dealers.region }).from(dealers).where(sql`${dealers.region} is not null`);
  return rows
    .map((r) => r.region)
    .filter((raw): raw is string => raw !== null)
    .filter((raw) => isNationwide(raw) || parseDealerRegions(raw).some((r) => regions.includes(r)));
}

async function buildConditions(filters: ListingSearchFilters) {
  // Defense in depth, not the primary fix: a $0/no-disclosed-price listing
  // (an "Enquire"/POA/auction-no-bid case — see turners.ts and
  // twocheapcars.ts) has already shown up from two different adapters now,
  // each encoding "no real price" differently. There's nothing to compare
  // fair value or ownership cost against for these regardless of source, so
  // this excludes any that slip through an adapter's own filtering too.
  const conditions = [eq(listings.status, "active"), sql`${listings.price} > 0`];

  if (filters.bodyType?.length) conditions.push(inArray(listings.bodyType, filters.bodyType));
  else if (!filters.includeMotorcycles) conditions.push(sql`${listings.bodyType} is distinct from 'motorcycle'`);
  if (filters.powertrain?.length) conditions.push(inArray(listings.powertrain, filters.powertrain));
  if (filters.make?.length) conditions.push(inArray(listings.make, filters.make));
  // Model is partial/case-insensitive (ilike), unlike make's exact-match
  // dropdown — model dropdown values aren't seeded (PLAN.md Phase 2), so
  // free text is the only input available and users won't always match a
  // dealer's exact casing/spacing (e.g. "RAV4" vs "Rav 4"). Multiple terms
  // (comma-separated in the UI) are OR'd together.
  if (filters.model?.length) {
    conditions.push(or(...filters.model.map((term) => ilike(listings.model, `%${term}%`)))!);
  }
  if (filters.transmission?.length) conditions.push(inArray(listings.transmission, filters.transmission));
  if (filters.region?.length) {
    const rawValues = await resolveRegionRawValues(filters.region);
    conditions.push(rawValues.length > 0 ? inArray(dealers.region, rawValues) : sql`false`);
  }
  if (filters.minPrice !== undefined) conditions.push(gte(listings.price, filters.minPrice.toFixed(2)));
  if (filters.maxPrice !== undefined) conditions.push(lte(listings.price, filters.maxPrice.toFixed(2)));
  if (filters.maxMileageKm !== undefined) conditions.push(lte(listings.mileageKm, filters.maxMileageKm));
  if (filters.minYear !== undefined) conditions.push(gte(listings.year, filters.minYear));
  if (filters.maxYear !== undefined) conditions.push(lte(listings.year, filters.maxYear));

  return and(...conditions);
}

type SearchRow = Awaited<ReturnType<typeof runSearchQuery>>[number];

export type ListingSearchResult = {
  rows: SearchRow[];
  totalCount: number;
  page: number;
  pageCount: number;
};

async function runSearchQuery(conditions: Awaited<ReturnType<typeof buildConditions>>, sort: ListingSort, page: number) {
  const query = db
    .select()
    .from(listings)
    .innerJoin(dealers, eq(listings.dealerId, dealers.id))
    .where(conditions);

  const offset = (page - 1) * PAGE_SIZE;

  if (sort === "mileage") {
    // Nulls last — a listing with unknown mileage shouldn't rank as "0km".
    return query.orderBy(sql`${listings.mileageKm} is null`, asc(listings.mileageKm)).limit(PAGE_SIZE).offset(offset);
  }
  if (sort === "price") {
    return query.orderBy(asc(listings.price)).limit(PAGE_SIZE).offset(offset);
  }

  // "total" (asking + 3-year ownership cost) can't be pushed down to SQL —
  // it depends on the same bracket-estimate math as the displayed ownership
  // breakdown (finance/fuel/servicing/insurance/repairs by body type,
  // powertrain, age, etc), so it's computed and sorted in JS instead.
  //
  // Fetching and costing *every* matching row was a real cost, not just a
  // theoretical one — on an unfiltered search (~9,000 listings) it made the
  // page take 2+ seconds. Ownership cost overhead scales with price too
  // (finance interest, insurance), so total-cost order tracks price order
  // closely; fetching a generous multiple of what's needed *up to and
  // including the requested page* keeps the true cheapest-by-total results
  // in the candidate set in practice, without costing the entire table on
  // every request.
  return query.orderBy(asc(listings.price)).limit(page * PAGE_SIZE * TOTAL_SORT_CANDIDATE_MULTIPLIER);
}

export async function searchListings(
  filters: ListingSearchFilters,
  sort: ListingSort = "total",
  totalCostOptions: TotalCostSortOptions = {},
  page: number = 1,
): Promise<ListingSearchResult> {
  const clampedPage = Math.min(Math.max(Math.trunc(page) || 1, 1), MAX_PAGE);
  const conditions = await buildConditions(filters);

  const [rawRows, [{ totalCount }]] = await Promise.all([
    runSearchQuery(conditions, sort, clampedPage),
    db.select({ totalCount: count() }).from(listings).innerJoin(dealers, eq(listings.dealerId, dealers.id)).where(conditions),
  ]);

  const pageCount = Math.min(Math.max(Math.ceil(totalCount / PAGE_SIZE), 1), MAX_PAGE);

  if (sort !== "total") {
    return { rows: rawRows, totalCount, page: clampedPage, pageCount };
  }

  const offset = (clampedPage - 1) * PAGE_SIZE;
  const ranked = rawRows
    .map((row) => {
      const price = parseFloat(row.listings.price);
      const ownershipTotal = estimate3YearOwnershipCost(
        {
          make: row.listings.make,
          year: row.listings.year ?? undefined,
          bodyType: row.listings.bodyType ?? undefined,
          powertrain: row.listings.powertrain ?? undefined,
          engine: row.listings.engine ?? undefined,
          price,
          mileageKm: row.listings.mileageKm ?? undefined,
        },
        totalCostOptions,
      ).total;
      return { row, totalCost: price + ownershipTotal };
    })
    .sort((a, b) => a.totalCost - b.totalCost)
    .slice(offset, offset + PAGE_SIZE)
    .map(({ row }) => row);

  return { rows: ranked, totalCount, page: clampedPage, pageCount };
}

/**
 * Mileage-bracket average price, aggregated in SQL over the *entire*
 * filtered set — not just the capped/paginated page of rows searchListings()
 * returns. Computing this from only the displayed page would silently shrink
 * to "average of the cheapest 60 matches" once a search exceeds RESULTS_LIMIT,
 * which defeats the point of the stat (see mileageStats.ts).
 */
export async function getMileageBracketStats(filters: ListingSearchFilters): Promise<MileageBracketStat[]> {
  const conditions = await buildConditions(filters);

  const bracketCase = sql<string>`case
    when ${listings.mileageKm} < 60000 then 'low'
    when ${listings.mileageKm} <= 120000 then 'medium'
    else 'high'
  end`;

  const rows = await db
    .select({
      bracket: bracketCase.as("bracket"),
      count: count(),
      averagePrice: sql<string>`avg(${listings.price})`,
    })
    .from(listings)
    .innerJoin(dealers, eq(listings.dealerId, dealers.id))
    .where(and(conditions, sql`${listings.mileageKm} is not null`))
    .groupBy(bracketCase);

  const byBracket = new Map(rows.map((r) => [r.bracket, r]));

  return BRACKET_DEFS.map(({ bracket, label, rangeLabel }) => {
    const row = byBracket.get(bracket);
    return {
      bracket,
      label,
      rangeLabel,
      count: row?.count ?? 0,
      averagePrice: row ? parseFloat(row.averagePrice) : null,
    };
  });
}

export type FirstSeenPrice = { price: number; observedAt: Date };

/** Earliest recorded price (+ when it was recorded) per listing, keyed by
 * listing id — for showing a "price dropped" badge against the current
 * asking price. Only listings that have actually changed price show up as a
 * real drop; a listing with just its first-seen snapshot has
 * firstPrice === current price, so callers should only badge a genuine
 * decrease. */
export async function getFirstSeenPrices(listingIds: number[]): Promise<Map<number, FirstSeenPrice>> {
  if (listingIds.length === 0) return new Map();

  const rows = await db
    .selectDistinctOn([listingPriceHistory.listingId], {
      listingId: listingPriceHistory.listingId,
      price: listingPriceHistory.price,
      observedAt: listingPriceHistory.observedAt,
    })
    .from(listingPriceHistory)
    .where(inArray(listingPriceHistory.listingId, listingIds))
    .orderBy(listingPriceHistory.listingId, asc(listingPriceHistory.observedAt));

  return new Map(rows.map((r) => [r.listingId, { price: parseFloat(r.price), observedAt: r.observedAt }]));
}

/** A single listing + its dealer, for the listing detail page. Returns
 * undefined if the id doesn't exist (any status — a delisted/unconfirmed
 * listing someone has a stale link to should still be viewable, just not
 * searchable). */
export async function getListingById(id: number) {
  const [row] = await db.select().from(listings).innerJoin(dealers, eq(listings.dealerId, dealers.id)).where(eq(listings.id, id));
  return row;
}

/** AI-written overview/reliability notes for a make+model (see
 * vehicle_model_descriptions) — seeded by make+model, not by generation/year,
 * so this is a best-effort match rather than a per-listing lookup. Returns
 * undefined for anything not yet seeded (most models, for now). */
export async function getVehicleModelDescription(make: string, model: string) {
  const [row] = await db
    .select()
    .from(vehicleModelDescriptions)
    .where(and(eq(vehicleModelDescriptions.make, make), ilike(vehicleModelDescriptions.model, model)));
  return row;
}

/** Distinct makes across active listings, for the search form's Make dropdown
 * — not seeded taxonomy (PLAN.md Phase 2 decided make/model values come from
 * scraped data, not a static list) so this queries the live DB directly. */
export async function getDistinctMakes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ make: listings.make })
    .from(listings)
    .where(eq(listings.status, "active"))
    .orderBy(asc(listings.make));
  return rows.map((r) => r.make);
}

/** Real NZ regions covered by at least one dealer, for the search form's
 * Region dropdown. Dealer.region is free text — see src/lib/regions.ts —
 * so a multi-location value like "Panmure, Auckland; Wigram, Christchurch"
 * is split into its actual regions ("Auckland", "Canterbury") rather than
 * shown as one raw, duplicate-prone string. "National"/"Unknown" dealers
 * contribute no region of their own (see isNationwide/parseDealerRegions). */
export async function getDistinctRegions(): Promise<string[]> {
  const rows = await db.selectDistinct({ region: dealers.region }).from(dealers).where(sql`${dealers.region} is not null`);
  const present = new Set(rows.flatMap((r) => parseDealerRegions(r.region)));
  return NZ_REGIONS.filter((r) => present.has(r));
}
