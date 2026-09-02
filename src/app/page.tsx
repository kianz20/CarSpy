import {
  searchListings,
  getMileageBracketStats,
  getDistinctMakes,
  getDistinctRegions,
  type ListingSearchFilters,
  type ListingSort,
} from "@/lib/search/listings";
import type { MileageBracketStat } from "@/lib/search/mileageStats";
import { getCategoryOptions } from "@/lib/taxonomy/query";
import {
  estimate3YearOwnershipCost,
  type InsuranceCoverType,
} from "@/lib/ownership";
import { SearchForm } from "@/components/search-form";
import { MileageStatsBar } from "@/components/mileage-stats-bar";
import { SortSelect } from "@/components/sort-select";
import { Pagination } from "@/components/pagination";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { AnimatedList } from "@/components/animated-list";
import { Disclaimer } from "@/components/disclaimer";

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
    "deposit",
    "financeEnabled",
    "annualKm",
    "insuranceCoverType",
    "sort",
  ]) {
    const value = first(params[key]);
    if (value) current[key] = value;
  }

  const deposit = toNumber(current.deposit);
  const annualKm = toNumber(current.annualKm);
  const insuranceCoverType: InsuranceCoverType | undefined =
    current.insuranceCoverType === "third_party_fire_theft" ||
    current.insuranceCoverType === "none"
      ? current.insuranceCoverType
      : undefined;
  // Financing defaults to off — the search form's checkbox pairs it with a
  // hidden fallback input so a submission always round-trips an explicit
  // "true" or "false" (a checkbox that's merely absent from the form data
  // can't be told apart from "never touched"). That presence is also what
  // distinguishes "the user actually submitted a search" from a bare first
  // visit to "/", so it still gates the real, DB-hitting search below.
  const financeEnabled = current.financeEnabled === "true";
  const hasSearched = current.financeEnabled !== undefined;
  const sort: ListingSort =
    current.sort === "price" || current.sort === "mileage" ? current.sort : "total";
  const page = toNumber(first(params.page)) ?? 1;

  const filters: ListingSearchFilters = {
    bodyType: current.bodyType,
    powertrain: current.powertrain,
    make: current.make,
    model: current.model,
    transmission: current.transmission,
    region: current.region,
    minPrice: toNumber(current.minPrice),
    maxPrice: toNumber(current.maxPrice),
    maxMileageKm: toNumber(current.maxMileageKm),
    minYear: toNumber(current.minYear),
    maxYear: toNumber(current.maxYear),
  };

  // Finance off means no loan is modeled at all — depositFraction: 1 forces
  // loanAmount (and so financeInterest) to $0 for every listing, and no
  // price-based filtering is applied beyond the existing min/max price
  // fields (deposit isn't a spending cap here, just a finance input).
  const financeOptions = financeEnabled ? { deposit } : { depositFraction: 1 };

  const [bodyTypes, powertrains, makes, regions] = await Promise.all([
    getCategoryOptions("body_type"),
    getCategoryOptions("powertrain"),
    getDistinctMakes(),
    getDistinctRegions(),
  ]);

  let listingsData: ListingCardData[] = [];
  let totalCount = 0;
  let resolvedPage = page;
  let pageCount = 1;
  let mileageStats: MileageBracketStat[] = [];

  if (hasSearched) {
    const [searchResult, stats] = await Promise.all([
      searchListings(filters, sort, { ...financeOptions, annualKm, insuranceCoverType }, page),
      getMileageBracketStats(filters),
    ]);
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
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Find your next <span className="accent-gradient-text">car</span>, not just a listing
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Search NZ dealer inventory nationwide and compare asking prices against the real
          3-year cost of owning each one — finance, fuel, servicing, insurance and repairs
          included.
        </p>
      </header>

      <div className="card p-4 sm:p-5">
        <SearchForm
          bodyTypes={bodyTypes}
          powertrains={powertrains}
          makes={makes}
          regions={regions}
          current={current}
        />
      </div>

      <Disclaimer />

      {!hasSearched ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <div className="text-3xl">🔍</div>
          <p className="text-sm font-medium">Set your filters above, then hit Search</p>
          <p className="text-xs text-muted">Matching listings will show up right here.</p>
        </div>
      ) : (
        <>
          {totalCount > 0 && <MileageStatsBar stats={mileageStats} />}

          {listingsData.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span>{" "}
                matching listing{totalCount === 1 ? "" : "s"}
              </p>
              <SortSelect current={sort} />
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
                  // Carries every current filter/sort/finance param (not
                  // just the finance ones) so the detail page's "Back to
                  // search" link can return to the exact search, not just
                  // restore the ownership-cost inputs — a plain Link isn't
                  // real browser history, so it has to reconstruct the full
                  // URL itself.
                  const detailParams = new URLSearchParams(current);
                  if (resolvedPage > 1) detailParams.set("page", String(resolvedPage));
                  const detailHref = `/listing/${listing.id}${detailParams.size > 0 ? `?${detailParams.toString()}` : ""}`;

                  return (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      detailHref={detailHref}
                      ownershipCost={estimate3YearOwnershipCost(
                        {
                          make: listing.make,
                          year: listing.year ?? undefined,
                          bodyType: listing.bodyType ?? undefined,
                          powertrain: listing.powertrain ?? undefined,
                          engine: listing.engine ?? undefined,
                          price: listing.price,
                          mileageKm: listing.mileageKm ?? undefined,
                        },
                        { ...financeOptions, annualKm, insuranceCoverType },
                      )}
                    />
                  );
                })}
              </AnimatedList>
            )}
          </div>

          <Pagination current={current} page={resolvedPage} pageCount={pageCount} />
        </>
      )}
    </div>
  );
}
