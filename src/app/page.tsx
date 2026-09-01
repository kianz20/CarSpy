import {
  searchListings,
  getMileageBracketStats,
  getDistinctMakes,
  getDistinctRegions,
  type ListingSearchFilters,
} from "@/lib/search/listings";
import type { MileageBracketStat } from "@/lib/search/mileageStats";
import { getCategoryOptions } from "@/lib/taxonomy/query";
import {
  estimate3YearOwnershipCost,
  type InsuranceCoverType,
} from "@/lib/ownership";
import { SearchForm } from "@/components/search-form";
import { MileageStatsBar } from "@/components/mileage-stats-bar";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
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
    "budget",
    "financeEnabled",
    "annualKm",
    "insuranceCoverType",
  ]) {
    const value = first(params[key]);
    if (value) current[key] = value;
  }

  const budget = toNumber(current.budget);
  const annualKm = toNumber(current.annualKm);
  const insuranceCoverType: InsuranceCoverType | undefined =
    current.insuranceCoverType === "third_party_fire_theft" ||
    current.insuranceCoverType === "none"
      ? current.insuranceCoverType
      : undefined;
  // Checkbox absence can't distinguish "never touched" from "explicitly
  // unchecked" on its own — the search form pairs it with a hidden fallback
  // input so an explicit uncheck always round-trips as the literal "false".
  const financeEnabled = current.financeEnabled !== "false";

  // Budget is a required field on the search form, so its presence in the
  // URL is what distinguishes "the user actually submitted a search" from a
  // bare first visit to "/" — skip the (real, DB-hitting) search entirely
  // until then, rather than showing the whole unfiltered inventory by default.
  const hasSearched = current.budget !== undefined;

  // With finance off, the user is paying cash — budget is a hard price
  // ceiling on top of (not instead of) any explicit max price they set.
  // With finance on, budget instead feeds the ownership-cost model as a
  // deposit (below), and doesn't constrain which listings can appear at all.
  const explicitMaxPrice = toNumber(current.maxPrice);
  const maxPrice =
    !financeEnabled && budget !== undefined
      ? Math.min(explicitMaxPrice ?? Infinity, budget)
      : explicitMaxPrice;

  const filters: ListingSearchFilters = {
    bodyType: current.bodyType,
    powertrain: current.powertrain,
    make: current.make,
    model: current.model,
    transmission: current.transmission,
    region: current.region,
    minPrice: toNumber(current.minPrice),
    maxPrice,
    maxMileageKm: toNumber(current.maxMileageKm),
    minYear: toNumber(current.minYear),
    maxYear: toNumber(current.maxYear),
  };

  // Cash purchase (finance off) means every shown listing is bought outright
  // — depositFraction: 1 forces loanAmount (and so financeInterest) to $0 for
  // all of them, regardless of the listing's own price, which is simpler
  // than computing a per-listing absolute deposit equal to its price.
  const financeOptions = financeEnabled
    ? { deposit: budget }
    : { depositFraction: 1 };

  const [bodyTypes, powertrains, makes, regions] = await Promise.all([
    getCategoryOptions("body_type"),
    getCategoryOptions("powertrain"),
    getDistinctMakes(),
    getDistinctRegions(),
  ]);

  let listingsData: ListingCardData[] = [];
  let totalCount = 0;
  let limited = false;
  let mileageStats: MileageBracketStat[] = [];

  if (hasSearched) {
    const [searchResult, stats] = await Promise.all([
      searchListings(filters),
      getMileageBracketStats(filters),
    ]);
    totalCount = searchResult.totalCount;
    limited = searchResult.limited;
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
      mileageKm: row.listings.mileageKm,
      importStatus: row.listings.importStatus,
      price: parseFloat(row.listings.price),
      dealerName: row.dealers.name,
      dealerRegion: row.dealers.region,
    }));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold">Find Your Car</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Search NZ dealer inventory and compare asking prices against what
          similar-mileage examples are currently going for.
        </p>
      </header>

      <SearchForm
        bodyTypes={bodyTypes}
        powertrains={powertrains}
        makes={makes}
        regions={regions}
        current={current}
      />

      <Disclaimer />

      {!hasSearched ? (
        <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Set your filters and budget above, then hit Search to see matching
          listings.
        </p>
      ) : (
        <>
          {totalCount > 0 && <MileageStatsBar stats={mileageStats} />}

          {limited && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing the cheapest {listingsData.length} of{" "}
              {totalCount.toLocaleString()} matching listings — narrow your
              search (body type, make, price, mileage) to see others.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {listingsData.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No listings match your search yet — try loosening a filter.
              </p>
            ) : (
              listingsData.map((listing) => {
                const detailParams = new URLSearchParams();
                if (current.budget) detailParams.set("budget", current.budget);
                if (current.financeEnabled)
                  detailParams.set("financeEnabled", current.financeEnabled);
                if (current.annualKm)
                  detailParams.set("annualKm", current.annualKm);
                if (current.insuranceCoverType)
                  detailParams.set(
                    "insuranceCoverType",
                    current.insuranceCoverType,
                  );
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
                        price: listing.price,
                        mileageKm: listing.mileageKm ?? undefined,
                      },
                      { ...financeOptions, annualKm, insuranceCoverType },
                    )}
                  />
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
