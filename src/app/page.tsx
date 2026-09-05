import Link from "next/link";
import type { Metadata } from "next";
import {
  searchListings,
  getMileageBracketStats,
  getDistinctMakes,
  getDistinctRegions,
  getFirstSeenPrices,
  getRecentPriceDrops,
  getBiggestPriceDrops,
  getInventoryStats,
  type ListingSearchFilters,
  type ListingSort,
} from "@/lib/search/listings";
import type { MileageBracketStat } from "@/lib/search/mileageStats";
import { getCategoryOptions } from "@/lib/taxonomy/query";
import {
  estimate3YearOwnershipCost,
  loadVehicleSpecs,
  matchVehicleSpec,
  fuelEconomyFromSpec,
  type InsuranceCoverType,
} from "@/lib/ownership";
import { SearchForm } from "@/components/search-form";
import { PriceDrops } from "@/components/price-drops";
import { PopularSearchChips } from "@/components/popular-search-chips";
import { MileageStatsBar } from "@/components/mileage-stats-bar";
import { SortSelect } from "@/components/sort-select";
import { Pagination } from "@/components/pagination";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { AnimatedList } from "@/components/animated-list";
import { getCurrentUser } from "@/lib/auth/session";
import { getWatchlistedListingIds } from "@/lib/watchlist";
import { parseListParam } from "@/lib/listParams";
import { getEffectiveDefaults } from "@/lib/settings";
import { logSearch } from "@/lib/searchAnalytics";
import { newRequestId, timed } from "@/lib/logging/timing";
import { getExistingSubscription } from "@/lib/search/subscriptions";
import { SubscribeSearchButton } from "@/components/subscribe-search-button";

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function getBackHref(params: SearchParams): string {
  // If we came from a listing detail page, go back there
  const backParam = first(params.back);
  if (backParam) return decodeURIComponent(backParam);
  // Otherwise go to the main search page
  return "/";
}

// Any query-string search here is a thin/duplicate variant of the same
// underlying inventory (there's no dedicated landing page for it yet — see
// the SEO plan's phase 2), so it's kept crawlable but out of the index;
// only the bare "/" is offered to Google as an indexable URL. `follow: true`
// still lets link equity flow through to whatever it links to.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.keys(params).length > 0;
  return hasFilters ? { robots: { index: false, follow: true } } : {};
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const reqId = newRequestId("HomePage");
  const params = await searchParams;

  const current: Record<string, string> = {};
  for (const key of [
    "bodyType",
    "powertrain",
    "make",
    "model",
    "transmission",
    "region",
    "minYear",
    "maxYear",
    "minPrice",
    "maxPrice",
    "maxMileageKm",
    "includeMotorcycles",
    "deposit",
    "financeEnabled",
    "annualKm",
    "insuranceCoverType",
    "sort",
  ]) {
    const value = first(params[key]);
    if (value) current[key] = value;
  }

  const insuranceCoverType: InsuranceCoverType | undefined =
    current.insuranceCoverType === "third_party_fire_theft" ||
    current.insuranceCoverType === "none"
      ? current.insuranceCoverType
      : undefined;
  // `hasSearched` stays keyed on the *literal* URL param, not the resolved
  // default below — it's what distinguishes "the user actually submitted a
  // search" (financeEnabled always round-trips explicitly once submitted,
  // see search-form.tsx's hidden-fallback comment) from a bare first visit,
  // regardless of what their saved settings say.
  const hasSearched = current.financeEnabled !== undefined;
  const sort: ListingSort =
    current.sort === "price" || current.sort === "mileage" ? current.sort : "total";
  const page = toNumber(first(params.page)) ?? 1;

  const filters: ListingSearchFilters = {
    bodyType: parseListParam(current.bodyType),
    powertrain: parseListParam(current.powertrain),
    make: parseListParam(current.make),
    model: parseListParam(current.model),
    transmission: parseListParam(current.transmission),
    region: parseListParam(current.region),
    minPrice: toNumber(current.minPrice),
    maxPrice: toNumber(current.maxPrice),
    maxMileageKm: toNumber(current.maxMileageKm),
    minYear: toNumber(current.minYear),
    maxYear: toNumber(current.maxYear),
    includeMotorcycles: current.includeMotorcycles === "true",
  };

  const [bodyTypes, powertrains, makes, regions, currentUser, defaults, inventoryStats] = await timed(reqId, "formOptions+user+defaults+stats", () =>
    Promise.all([
      getCategoryOptions("body_type"),
      getCategoryOptions("powertrain"),
      getDistinctMakes(),
      getDistinctRegions(),
      getCurrentUser(),
      getEffectiveDefaults(),
      getInventoryStats(),
    ]),
  );
  // Kicked off here rather than awaited immediately — none of these four
  // depend on anything from the hasSearched block below (watchlistedIds and
  // existingSubscription only need currentUser, already resolved above;
  // recentPriceDrops only needs the hasSearched flag from the URL;
  // vehicleSpecs is its own cached lookup), so letting them run concurrently
  // with that block's DB round trip instead of strictly before or after it
  // removes a full serial network round-trip from every page load (see the
  // timing investigation — each round trip to the DB costs a real minimum
  // even warm, and these were previously back-to-back awaits).
  const watchlistedIdsPromise = currentUser
    ? timed(reqId, "getWatchlistedListingIds", () => getWatchlistedListingIds(currentUser.id))
    : Promise.resolve(undefined);
  const recentPriceDropsPromise = hasSearched ? Promise.resolve([]) : timed(reqId, "getRecentPriceDrops", () => getRecentPriceDrops(6));
  const biggestPriceDropsPromise = hasSearched ? Promise.resolve([]) : timed(reqId, "getBiggestPriceDrops", () => getBiggestPriceDrops(6));
  const vehicleSpecsPromise = timed(reqId, "loadVehicleSpecs", () => loadVehicleSpecs());
  const existingSubscriptionPromise =
    currentUser && hasSearched
      ? timed(reqId, "getExistingSubscription", () => getExistingSubscription(currentUser.id, filters))
      : Promise.resolve(undefined);

  // Falls back to the user's saved settings only when the URL doesn't
  // already say — a submitted search always carries explicit financeEnabled/
  // annualKm (see hasSearched above), so this mainly matters for a listing
  // link opened with no search params at all, or the pre-search form's own
  // initial values (see the `current.x ?? String(defaults.x)` below).
  const deposit = toNumber(current.deposit) ?? defaults.deposit;
  const annualKm = toNumber(current.annualKm) ?? defaults.annualKm;
  const financeEnabled = current.financeEnabled !== undefined ? current.financeEnabled === "true" : defaults.financeEnabled;

  // Finance off means no loan is modeled at all — depositFraction: 1 forces
  // loanAmount (and so financeInterest) to $0 for every listing, and no
  // price-based filtering is applied beyond the existing min/max price
  // fields (deposit isn't a spending cap here, just a finance input).
  const financeOptions = financeEnabled ? { deposit } : { depositFraction: 1 };

  let listingsData: ListingCardData[] = [];
  let totalCount = 0;
  let resolvedPage = page;
  let pageCount = 1;
  let mileageStats: MileageBracketStat[] = [];

  if (hasSearched) {
    const [searchResult, stats] = await timed(reqId, "searchListings+mileageBracketStats", () =>
      Promise.all([
        searchListings(
          filters,
          sort,
          { ...financeOptions, annualKm, insuranceCoverType, ownershipYears: defaults.ownershipYears },
          page,
        ),
        getMileageBracketStats(filters),
      ]),
    );
    totalCount = searchResult.totalCount;
    resolvedPage = searchResult.page;
    pageCount = searchResult.pageCount;
    mileageStats = stats;
    listingsData = searchResult.rows.map((row) => ({
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
    await logSearch(filters, sort, totalCount, currentUser);
  }

  const [firstSeenPrices, vehicleSpecs, watchlistedIds, recentPriceDrops, biggestPriceDrops, existingSubscription] = await timed(
    reqId,
    "firstSeenPrices+watchlist+priceDrops+specs+subscription",
    () =>
      Promise.all([
        getFirstSeenPrices(listingsData.map((l) => l.id)),
        vehicleSpecsPromise,
        watchlistedIdsPromise,
        recentPriceDropsPromise,
        biggestPriceDropsPromise,
        existingSubscriptionPromise,
      ]),
  );

  return (
    <div className="mx-auto w-full max-w-[1700px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      {!hasSearched && (
        <header className="mb-6 flex flex-col gap-2 lg:mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find your next <span className="accent-gradient-text">car</span>
          </h1>
          <p className="max-w-2xl text-sm text-muted">
            Search NZ dealer inventory nationwide and compare asking prices against the real
            annual maintenance cost of each one — finance, fuel, servicing, insurance and repairs
            included.
          </p>
          <p className="text-xs font-medium text-muted">
            Searching <span className="text-foreground">{inventoryStats.listingCount.toLocaleString()}</span>{" "}
            vehicles across <span className="text-foreground">{inventoryStats.dealerCount.toLocaleString()}</span>{" "}
            dealers
          </p>
        </header>
      )}

      {!hasSearched ? (
        // Before the first search, the filter form is the whole point of the
        // page — give it the width a cramped 320px sidebar can't, instead of
        // burying it next to an empty results area. The price-drops teaser
        // sits to its right when there's anything to show, so the page isn't
        // just an empty form on a first visit — same max-w-4xl form width
        // either way, just widening the overall container to make room.
        <div
          className={`mx-auto w-full ${recentPriceDrops.length > 0 || biggestPriceDrops.length > 0 ? "max-w-7xl lg:grid lg:grid-cols-[240px_1fr_280px] lg:items-start lg:gap-8" : "max-w-6xl lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8"}`}
        >
          <div className="order-2 mt-6 lg:order-1 lg:mt-0">
            <PopularSearchChips financeEnabled={defaults.financeEnabled} />
          </div>
          <div className="card order-1 mt-6 p-6 sm:p-8 lg:order-2 lg:mt-0">
            <SearchForm
              bodyTypes={bodyTypes}
              powertrains={powertrains}
              makes={makes}
              regions={regions}
              current={current}
              defaults={defaults}
            />
          </div>
          {(recentPriceDrops.length > 0 || biggestPriceDrops.length > 0) && (
            <div className="order-3 mt-6 lg:mt-0">
              <PriceDrops recent={recentPriceDrops} biggest={biggestPriceDrops} />
            </div>
          )}
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-8 xl:grid-cols-[320px_1fr_260px]">
          <aside className="relative mb-6 lg:sticky lg:top-20 lg:col-start-1 lg:row-start-2 lg:mb-0">
            {/* At lg+, absolutely positioned above the filter box (not
                pushed into flow above it) — the box itself stays exactly
                where it was. Right-aligned against the box, not the results
                column. Below lg, the aside isn't sticky/offset from the top
                the way it is at lg, so the same -41px trick would land
                Back underneath the sticky header instead — normal flow
                there, just pushing the card down by its own height.
                Returns to the wide, pre-search filter layout; Clear filters
                (below, in the form) deliberately doesn't do this anymore —
                it just resets which listings match while staying here. */}
            <Link
              href={getBackHref(params)}
              className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-accent lg:absolute lg:-top-[41px] lg:right-0 lg:mb-0"
            >
              <span aria-hidden="true">←</span> Back
            </Link>
            <div className="card p-4 sm:p-5">
              <SearchForm
                bodyTypes={bodyTypes}
                powertrains={powertrains}
                makes={makes}
                regions={regions}
                current={current}
              defaults={defaults}
              />
            </div>
          </aside>

          {hasSearched && (
            <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2 lg:col-start-2 lg:row-start-1 lg:mb-6 lg:top-[10px]">
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span>{" "}
                matching listing{totalCount === 1 ? "" : "s"}
              </p>
              <SubscribeSearchButton
                filters={filters}
                isLoggedIn={currentUser !== undefined}
                existingSubscription={existingSubscription}
              />
              <SortSelect current={sort} />
            </div>
          )}

          <main className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-2">
            {totalCount > 0 && (
              <div className="xl:hidden">
                <MileageStatsBar stats={mileageStats} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              {listingsData.length === 0 ? (
                <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <div className="text-3xl">🚗💨</div>
                  <p className="text-sm font-medium">No listings match your search yet</p>
                  <p className="text-xs text-muted">Try loosening a filter.</p>
                </div>
              ) : (
                <AnimatedList>
                  {listingsData.map((listing) => {
                    // Carries every current filter/sort/finance param
                    // (not just the finance ones) so the detail page's
                    // "Back to search" link can return to the exact
                    // search, not just restore the ownership-cost
                    // inputs — a plain Link isn't real browser history,
                    // so it has to reconstruct the full URL itself.
                    const detailParams = new URLSearchParams(current);
                    if (resolvedPage > 1) detailParams.set("page", String(resolvedPage));
                    // Include the current search URL as the back parameter so users
                    // can navigate back to these results from the listing detail page
                    const backSearchUrl = `/?${detailParams.toString()}`;
                    detailParams.set("back", backSearchUrl);
                    const detailHref = `/listing/${listing.id}${detailParams.size > 0 ? `?${detailParams.toString()}` : ""}`;

                    return (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        detailHref={detailHref}
                        isWatchlisted={watchlistedIds?.has(listing.id)}
                        firstSeenPrice={firstSeenPrices.get(listing.id)}
                        ownershipCost={estimate3YearOwnershipCost(
                          {
                            make: listing.make,
                            year: listing.year ?? undefined,
                            bodyType: listing.bodyType ?? undefined,
                            powertrain: listing.powertrain ?? undefined,
                            engine: listing.engine ?? undefined,
                            matchedFuelEconomyL100km: fuelEconomyFromSpec(
                              matchVehicleSpec(vehicleSpecs, listing.make, listing.model, listing.year ?? undefined, listing.powertrain ?? undefined),
                            ),
                            price: listing.price,
                            mileageKm: listing.mileageKm ?? undefined,
                          },
                          { ...financeOptions, annualKm, insuranceCoverType, ownershipYears: defaults.ownershipYears },
                        )}
                      />
                    );
                  })}
                </AnimatedList>
              )}
            </div>

            <Pagination current={current} page={resolvedPage} pageCount={pageCount} />
          </main>

          {totalCount > 0 && (
            <aside className="hidden xl:sticky xl:top-20 xl:col-start-3 xl:row-start-2 xl:block">
              <MileageStatsBar stats={mileageStats} orientation="vertical" />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
