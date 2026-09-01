import { and, asc, count, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { listings, dealers } from "@/db/schema";
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
  bodyType?: string;
  powertrain?: string;
  make?: string;
  model?: string;
  transmission?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  maxMileageKm?: number;
  minYear?: number;
  maxYear?: number;
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
// site had hung. Capped instead of paginated for now (v1 simplicity); real
// pagination is a natural follow-up once result sets need browsing past the
// cap rather than narrowing.
const RESULTS_LIMIT = 60;

/** Dealer.region is free text (see src/lib/regions.ts) — a dealer whose raw
 * value is e.g. "Wigram, Christchurch" or "Panmure, Auckland; Wigram,
 * Christchurch" needs to match a search for the real region ("Canterbury",
 * "Auckland") it covers, not an exact string. Resolves the search's region
 * filter to the actual raw dealer.region values that belong to it (plus any
 * "National" dealer, which covers every region). */
async function resolveRegionRawValues(region: string): Promise<string[]> {
  const rows = await db.selectDistinct({ region: dealers.region }).from(dealers).where(sql`${dealers.region} is not null`);
  return rows
    .map((r) => r.region)
    .filter((raw): raw is string => raw !== null)
    .filter((raw) => isNationwide(raw) || parseDealerRegions(raw).includes(region));
}

async function buildConditions(filters: ListingSearchFilters) {
  // Defense in depth, not the primary fix: a $0/no-disclosed-price listing
  // (an "Enquire"/POA/auction-no-bid case — see turners.ts and
  // twocheapcars.ts) has already shown up from two different adapters now,
  // each encoding "no real price" differently. There's nothing to compare
  // fair value or ownership cost against for these regardless of source, so
  // this excludes any that slip through an adapter's own filtering too.
  const conditions = [eq(listings.status, "active"), sql`${listings.price} > 0`];

  if (filters.bodyType) conditions.push(eq(listings.bodyType, filters.bodyType));
  if (filters.powertrain) conditions.push(eq(listings.powertrain, filters.powertrain));
  if (filters.make) conditions.push(eq(listings.make, filters.make));
  // Model is partial/case-insensitive (ilike), unlike make's exact-match
  // dropdown — model dropdown values aren't seeded (PLAN.md Phase 2), so
  // free text is the only input available and users won't always match a
  // dealer's exact casing/spacing (e.g. "RAV4" vs "Rav 4").
  if (filters.model) conditions.push(ilike(listings.model, `%${filters.model}%`));
  if (filters.transmission) conditions.push(eq(listings.transmission, filters.transmission));
  if (filters.region) {
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
  limited: boolean;
};

async function runSearchQuery(conditions: Awaited<ReturnType<typeof buildConditions>>, sort: ListingSort) {
  const query = db
    .select()
    .from(listings)
    .innerJoin(dealers, eq(listings.dealerId, dealers.id))
    .where(conditions);

  if (sort === "mileage") {
    // Nulls last — a listing with unknown mileage shouldn't rank as "0km".
    return query.orderBy(sql`${listings.mileageKm} is null`, asc(listings.mileageKm)).limit(RESULTS_LIMIT);
  }
  if (sort === "price") {
    return query.orderBy(asc(listings.price)).limit(RESULTS_LIMIT);
  }

  // "total" (asking + 3-year ownership cost) can't be pushed down to SQL —
  // it depends on the same bracket-estimate math as the displayed ownership
  // breakdown (finance/fuel/servicing/insurance/repairs by body type,
  // powertrain, age, etc). Fetch every matching row (already scanned once
  // for the count query below, so this isn't a new class of cost) and sort
  // in JS, since ordering has to happen before the RESULTS_LIMIT cut — the
  // cheapest-by-price top 60 isn't necessarily the cheapest-by-total 60.
  return query.orderBy(asc(listings.price));
}

export async function searchListings(
  filters: ListingSearchFilters,
  sort: ListingSort = "total",
  totalCostOptions: TotalCostSortOptions = {},
): Promise<ListingSearchResult> {
  const conditions = await buildConditions(filters);

  const [allRows, [{ totalCount }]] = await Promise.all([
    runSearchQuery(conditions, sort),
    db.select({ totalCount: count() }).from(listings).innerJoin(dealers, eq(listings.dealerId, dealers.id)).where(conditions),
  ]);

  if (sort !== "total") {
    return { rows: allRows, totalCount, limited: totalCount > allRows.length };
  }

  const ranked = allRows
    .map((row) => {
      const price = parseFloat(row.listings.price);
      const ownershipTotal = estimate3YearOwnershipCost(
        {
          make: row.listings.make,
          year: row.listings.year ?? undefined,
          bodyType: row.listings.bodyType ?? undefined,
          powertrain: row.listings.powertrain ?? undefined,
          price,
          mileageKm: row.listings.mileageKm ?? undefined,
        },
        totalCostOptions,
      ).total;
      return { row, totalCost: price + ownershipTotal };
    })
    .sort((a, b) => a.totalCost - b.totalCost)
    .slice(0, RESULTS_LIMIT)
    .map(({ row }) => row);

  return { rows: ranked, totalCount, limited: totalCount > ranked.length };
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

/** A single listing + its dealer, for the listing detail page. Returns
 * undefined if the id doesn't exist (any status — a delisted/unconfirmed
 * listing someone has a stale link to should still be viewable, just not
 * searchable). */
export async function getListingById(id: number) {
  const [row] = await db.select().from(listings).innerJoin(dealers, eq(listings.dealerId, dealers.id)).where(eq(listings.id, id));
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
