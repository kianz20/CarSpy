import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getListingById,
  getVehicleModelDescription,
  getFirstSeenPrices,
  getSimilarListingStats,
} from "@/lib/search/listings";
import {
  estimate3YearOwnershipCost,
  loadVehicleSpecs,
  matchVehicleSpec,
  fuelEconomyFromSpec,
  type InsuranceCoverType,
} from "@/lib/ownership";
import { OwnershipBreakdown } from "@/components/ownership-breakdown";
import { SafetyRating } from "@/components/safety-rating";
import { getEffectiveDefaults } from "@/lib/settings";
import { ListingImage } from "@/components/listing-image";
import { getStockImageUrl } from "@/lib/stockImage";
import { formatCurrency, formatEngine, formatNumber } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth/session";
import { isListingWatchlisted } from "@/lib/watchlist";
import { WatchlistButton } from "@/components/watchlist-button";
import { ShareButton } from "@/components/share-button";
import { toListParam } from "@/lib/listParams";
import { DistributionBar } from "@/components/comparison-distribution";
import { SmoothAccordion } from "@/components/smooth-accordion";
import { ListingAccordions } from "@/components/listing-accordions";

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const row = await getListingById(listingId);
  if (!row) notFound();

  const { listings: listing, dealers: dealer } = row;
  const price = parseFloat(listing.price);

  // None of these depend on each other — awaiting them one at a time (as
  // this used to) meant paying for five sequential DB round-trips before
  // the page could render at all, even though each query itself is fast.
  const [modelDescription, currentUser, firstSeenPrices, similarStats, defaults] = await Promise.all([
    getVehicleModelDescription(listing.make, listing.model),
    getCurrentUser(),
    getFirstSeenPrices([listing.id]),
    getSimilarListingStats(listing.make, listing.model, listing.year ?? undefined),
    getEffectiveDefaults(),
  ]);
  const isWatchlisted = currentUser ? await isListingWatchlisted(currentUser.id, listing.id) : undefined;
  const firstSeenPrice = firstSeenPrices.get(listing.id);
  const priceDrop = firstSeenPrice !== undefined ? firstSeenPrice.price - price : 0;

  // Carries the same deposit/financeEnabled/annualKm the user set on the
  // search page so the breakdown here matches what they saw on the results
  // list — falling back to the viewer's own saved settings (not the search's
  // originating user's) when a param is absent, e.g. a bare shared listing
  // link with no search context at all.
  const query = await searchParams;
  const deposit = toNumber(first(query.deposit)) ?? defaults.deposit;
  const annualKm = toNumber(first(query.annualKm)) ?? defaults.annualKm;
  const queryInsuranceCoverType = first(query.insuranceCoverType);
  const insuranceCoverType: InsuranceCoverType | undefined =
    queryInsuranceCoverType === "third_party_fire_theft" || queryInsuranceCoverType === "none" ? queryInsuranceCoverType : undefined;
  const rawFinanceEnabled = first(query.financeEnabled);
  const financeEnabled = rawFinanceEnabled !== undefined ? rawFinanceEnabled === "true" : defaults.financeEnabled;

  // Finance off means no loan is modeled at all — depositFraction: 1 forces
  // loanAmount (and so financeInterest) to $0, consistent with how the
  // search results list computes the same listing's cost.
  const financeOptions = financeEnabled ? { deposit } : { depositFraction: 1 };

  // ?ownershipYears= still overrides for a shared link (clamped to the 1-5
  // range Settings itself offers), but the slider that used to let a visitor
  // adjust this per-listing is gone — it's a Settings-page default now.
  const rawOwnershipYears = toNumber(first(query.ownershipYears));
  const ownershipYears =
    rawOwnershipYears !== undefined ? Math.min(Math.max(Math.round(rawOwnershipYears), 1), 5) : defaults.ownershipYears;

  const vehicleSpecs = await loadVehicleSpecs();
  const matchedVehicleSpec = matchVehicleSpec(vehicleSpecs, listing.make, listing.model, listing.year ?? undefined, listing.powertrain ?? undefined);
  const matchedFuelEconomyL100km = fuelEconomyFromSpec(matchedVehicleSpec);

  // Safety star rating (ANCAP/UCSR/VSRR, per VEEEL) — like fuel economy,
  // only ever real per-variant data from the curated vehicleSpecs table,
  // never an estimate/guess, so it's simply omitted when there's no match.
  const safetyStars = matchedVehicleSpec?.safetyStars != null ? Number(matchedVehicleSpec.safetyStars) : undefined;

  const ownershipCost = estimate3YearOwnershipCost(
    {
      make: listing.make,
      year: listing.year ?? undefined,
      bodyType: listing.bodyType ?? undefined,
      powertrain: listing.powertrain ?? undefined,
      engine: listing.engine ?? undefined,
      matchedFuelEconomyL100km,
      price,
      mileageKm: listing.mileageKm ?? undefined,
    },
    { ...financeOptions, annualKm, insuranceCoverType, ownershipYears },
  );

  // Forwards every param this page received verbatim (filters, sort, page,
  // and the finance ones) — page.tsx's detailHref is what put them there in
  // the first place, so replaying them all is what gets this plain Link
  // back to the exact search, not just the ownership-cost inputs.
  const backParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const v = first(value);
    if (v) backParams.set(key, v);
  }
  const backHref = `/${backParams.size > 0 ? `?${backParams.toString()}` : ""}`;

  // Same make+model, not just model — "other listings for this model" means
  // other Corollas, not every "Corolla"-badged trim across every make (there
  // isn't one, but the intent generalizes). Reuses the same comma-list param
  // encoding the search form's multi-select filters already write (see
  // lib/listParams.ts) even though there's only one value here.
  const sameModelParams = new URLSearchParams({
    make: toListParam([listing.make]),
    model: toListParam([listing.model]),
    financeEnabled: "false",
    annualKm: "12000",
    sort: "total",
  });
  const sameModelHref = `/?${sameModelParams.toString()}`;

  // Similar listings: same make/model but also filtered to similar age vehicles
  // (±3 years) to match the comparison stats shown in the comparison box.
  const similarListingsParams = new URLSearchParams(sameModelParams);
  if (listing.year !== null) {
    similarListingsParams.set("minYear", String(listing.year - 3));
    similarListingsParams.set("maxYear", String(listing.year + 3));
  }
  const similarListingsHref = `/?${similarListingsParams.toString()}`;

  return (
    <div className="mx-auto w-full max-w-[1700px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <Link href={backHref} className="mb-6 flex w-fit items-center gap-1 text-sm text-muted hover:text-accent lg:mb-8">
        <span aria-hidden="true">←</span> Back to search
      </Link>

      <div className="lg:grid lg:grid-cols-[1fr_700px] lg:items-start lg:gap-8">
        <main className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {listing.year} {listing.make} {listing.model}
              </h1>
              {listing.variant && <p className="text-sm text-muted">{listing.variant}</p>}
            </div>
            <Link href={`${sameModelHref}&back=${encodeURIComponent(`/listing/${listing.id}`)}`} className="text-sm text-accent hover:underline">
              See other {listing.make} {listing.model} listings →
            </Link>
          </header>

          <ListingImage
            src={listing.imageUrl ?? undefined}
            fallbackSrc={getStockImageUrl(listing.make, listing.model, listing.year ?? undefined)}
            alt={`${listing.year ?? ""} ${listing.make} ${listing.model}`.trim()}
          />

          <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-extrabold accent-gradient-text">{formatCurrency(price)}</div>
                {priceDrop > 0 && (
                  <span className="pill bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                    ↓ {formatCurrency(priceDrop)} since first seen
                  </span>
                )}
              </div>
              <div className="text-xs text-muted">asking price</div>
            </div>
            <div className="flex items-center gap-2">
              {isWatchlisted !== undefined && (
                <WatchlistButton listingId={listing.id} isWatchlisted={isWatchlisted} variant="button" />
              )}
              <ShareButton listingId={listing.id} />
              <a href={listing.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                View on {dealer.name} →
              </a>
            </div>
          </div>

          <div className="card grid grid-cols-2 gap-4 p-4 text-sm sm:grid-cols-3">
            <Detail label="Mileage" value={listing.mileageKm !== null ? (listing.mileageKm === 0 ? "New" : `${formatNumber(listing.mileageKm)} km`) : undefined} />
            <Detail label="Transmission" value={listing.transmission ?? undefined} capitalize />
            <Detail label="Fuel type" value={listing.powertrain ?? undefined} capitalize />
            <Detail label="Vehicle type" value={listing.bodyType?.replace("_", " ")} capitalize />
            {safetyStars !== undefined && (
              <div>
                <div className="text-xs font-semibold text-muted">Safety rating</div>
                <SafetyRating stars={safetyStars} testLabel={matchedVehicleSpec?.safetyTest ?? undefined} />
              </div>
            )}
            <Detail label="Engine" value={listing.engine ? formatEngine(listing.engine) : undefined} />
            <Detail label="Import status" value={listing.importStatus === "nz_new" ? "NZ new" : listing.importStatus === "import" ? "Import" : undefined} />
            <Detail label="VIN" value={listing.vin ?? undefined} />
            <Detail label="Dealer" value={dealer.name} />
            <Detail label="Region" value={dealer.region ?? undefined} />
          </div>

          {modelDescription && (
            <div className="card flex flex-col gap-3 p-4">
              <h2 className="text-sm font-semibold">
                About the {listing.make} {listing.model}
              </h2>
              <p className="text-sm text-foreground/90">{modelDescription.description}</p>

              {modelDescription.reliabilityIssues && (
                <div className="flex flex-col gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Reliability &amp; common issues
                  </span>
                  <p className="text-sm text-foreground/90">{modelDescription.reliabilityIssues}</p>
                </div>
              )}

              {modelDescription.notes && (
                <p className="text-xs text-muted">{modelDescription.notes}</p>
              )}

              <p className="text-[10px] text-muted/80">
                Overview based on general model reputation — not specific to this listing. Always get a pre-purchase inspection.
              </p>
            </div>
          )}
        </main>

        <aside className="mt-6 flex flex-col gap-3 lg:sticky lg:top-20 lg:mt-0">
          {similarStats ? (
            <ListingAccordions
              ownershipTitle={ownershipCost.ownershipYears === 1 ? "Annual maintenance costs" : `${ownershipCost.ownershipYears}-year ownership costs`}
              ownershipPrice={<span className="text-lg font-extrabold accent-gradient-text">{formatCurrency(ownershipCost.total)}</span>}
              ownershipContent={
                <OwnershipBreakdown
                  breakdown={ownershipCost}
                  price={price}
                  bodyType={listing.bodyType}
                  powertrain={listing.powertrain}
                  engine={listing.engine}
                  matchedFuelEconomyL100km={matchedFuelEconomyL100km}
                  make={listing.make}
                  year={listing.year}
                  mileageKm={listing.mileageKm}
                  deposit={financeEnabled ? deposit : undefined}
                  financeEnabled={financeEnabled}
                  annualKm={annualKm}
                />
              }
              comparisonTitle="How this listing compares to similar listings"
              comparisonRightContent={
                listing.year !== null && (
                  <span className="text-sm text-muted">
                    {listing.make} {listing.model}, {listing.year - 3}–{listing.year + 3}
                  </span>
                )
              }
              comparisonContent={
                <div className="flex flex-col gap-5">
                  <DistributionBar
                    label="Price"
                    metric="price"
                    model={`${listing.make} ${listing.model}`}
                    min={similarStats.minPrice}
                    max={similarStats.maxPrice}
                    avg={similarStats.avgPrice}
                    current={price}
                    minFormatted={formatCurrency(similarStats.minPrice)}
                    maxFormatted={formatCurrency(similarStats.maxPrice)}
                    avgFormatted={formatCurrency(similarStats.avgPrice)}
                    currentFormatted={formatCurrency(price)}
                    count={similarStats.count}
                  />

                  {listing.mileageKm !== null && similarStats.minMileageKm !== null && similarStats.maxMileageKm !== null && (
                    <DistributionBar
                      label="Mileage"
                      metric="mileage"
                      model={`${listing.make} ${listing.model}`}
                      min={similarStats.minMileageKm}
                      max={similarStats.maxMileageKm}
                      avg={similarStats.avgMileageKm ?? similarStats.minMileageKm}
                      current={listing.mileageKm}
                      minFormatted={`${formatNumber(Math.round(similarStats.minMileageKm))} km`}
                      maxFormatted={`${formatNumber(Math.round(similarStats.maxMileageKm))} km`}
                      avgFormatted={`${formatNumber(Math.round(similarStats.avgMileageKm ?? similarStats.minMileageKm))} km`}
                      currentFormatted={`${formatNumber(Math.round(listing.mileageKm))} km`}
                      count={similarStats.count}
                    />
                  )}

                  <Link href={similarListingsHref} className="text-xs font-semibold text-accent hover:underline">
                    See all similar listings →
                  </Link>
                </div>
              }
            />
          ) : (
            <SmoothAccordion
              id="ownership-details"
              title={<span>{ownershipCost.ownershipYears === 1 ? "Annual maintenance costs" : `${ownershipCost.ownershipYears}-year ownership costs`}</span>}
              rightContent={<span className="text-lg font-extrabold accent-gradient-text">{formatCurrency(ownershipCost.total)}</span>}
              isOpen={true}
            >
              <OwnershipBreakdown
                breakdown={ownershipCost}
                price={price}
                bodyType={listing.bodyType}
                powertrain={listing.powertrain}
                engine={listing.engine}
                make={listing.make}
                year={listing.year}
                mileageKm={listing.mileageKm}
                deposit={financeEnabled ? deposit : undefined}
                financeEnabled={financeEnabled}
                annualKm={annualKm}
              />
            </SmoothAccordion>
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value, capitalize }: { label: string; value?: string; capitalize?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className={capitalize ? "capitalize" : undefined}>{value}</div>
    </div>
  );
}
