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
  // Checkbox absence can't distinguish "never touched" from "explicitly
  // unchecked" on its own — the search form pairs it with a hidden fallback
  // input so an explicit uncheck always round-trips as the literal "false".
  // Its presence is also what distinguishes "the user actually submitted a
  // search" from a bare first visit to "/" — deposit alone can't do that
  // anymore since the search form only requires/renders it when finance is
  // enabled, so skip the (real, DB-hitting) search entirely until then.
  const financeEnabled = current.financeEnabled !== "false";
  const hasSearched = current.financeEnabled !== undefined;
  const sort: ListingSort =
    current.sort === "price" || current.sort === "mileage" ? current.sort : "total";

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
  let limited = false;
  let mileageStats: MileageBracketStat[] = [];

  if (hasSearched) {
    const [searchResult, stats] = await Promise.all([
      searchListings(filters, sort, { ...financeOptions, annualKm, insuranceCoverType }),
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
      imageUrl: row.listings.imageUrl,
    }));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold">Find Your Car (BETA)</h1>
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
          Set your filters above, then hit Search to see matching listings.
        </p>
      ) : (
        <>
          {totalCount > 0 && <MileageStatsBar stats={mileageStats} />}

          {listingsData.length > 0 && (
            <div className="flex justify-end">
              <SortSelect current={sort} />
            </div>
          )}

          {limited && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing the {sort === "mileage" ? "lowest-mileage" : "cheapest"}{" "}
              {listingsData.length} of {totalCount.toLocaleString()} matching
              listings — narrow your search (body type, make, price, mileage)
              to see others.
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
                if (current.deposit)
                  detailParams.set("deposit", current.deposit);
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
