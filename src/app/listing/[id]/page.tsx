import { notFound } from "next/navigation";
import Link from "next/link";
import { getListingById, getVehicleModelDescription } from "@/lib/search/listings";
import { estimate3YearOwnershipCost, type InsuranceCoverType } from "@/lib/ownership";
import { OwnershipBreakdown } from "@/components/ownership-breakdown";
import { OwnershipYearsSlider } from "@/components/ownership-years-slider";
import { ListingImage } from "@/components/listing-image";
import { getStockImageUrl } from "@/lib/stockImage";
import { formatCurrency, formatEngine, formatNumber } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth/session";
import { isListingWatchlisted } from "@/lib/watchlist";
import { WatchlistButton } from "@/components/watchlist-button";

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
  const modelDescription = await getVehicleModelDescription(listing.make, listing.model);
  const currentUser = await getCurrentUser();
  const isWatchlisted = currentUser ? await isListingWatchlisted(currentUser.id, listing.id) : undefined;

  // Carries the same deposit/financeEnabled/annualKm the user set on the
  // search page so the breakdown here matches what they saw on the results
  // list, rather than silently reverting to defaults.
  const query = await searchParams;
  const deposit = toNumber(first(query.deposit));
  const annualKm = toNumber(first(query.annualKm));
  const queryInsuranceCoverType = first(query.insuranceCoverType);
  const insuranceCoverType: InsuranceCoverType | undefined =
    queryInsuranceCoverType === "third_party_fire_theft" || queryInsuranceCoverType === "none" ? queryInsuranceCoverType : undefined;
  // Financing defaults to off — see search-form.tsx's hidden-fallback
  // comment for why absence here (an old link predating this field, say)
  // reads the same as an explicit "false".
  const financeEnabled = first(query.financeEnabled) === "true";

  // Finance off means no loan is modeled at all — depositFraction: 1 forces
  // loanAmount (and so financeInterest) to $0, consistent with how the
  // search results list computes the same listing's cost.
  const financeOptions = financeEnabled ? { deposit } : { depositFraction: 1 };

  // Lets a visitor re-run the estimate over a different horizon via the
  // slider below — clamped to the 1-5 range the slider itself offers, so a
  // hand-edited URL can't ask for something the UI doesn't represent.
  const rawOwnershipYears = toNumber(first(query.ownershipYears));
  const ownershipYears =
    rawOwnershipYears !== undefined ? Math.min(Math.max(Math.round(rawOwnershipYears), 1), 5) : 3;

  const ownershipCost = estimate3YearOwnershipCost(
    {
      make: listing.make,
      year: listing.year ?? undefined,
      bodyType: listing.bodyType ?? undefined,
      powertrain: listing.powertrain ?? undefined,
      engine: listing.engine ?? undefined,
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

  return (
    <div className="mx-auto w-full max-w-[1700px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <Link href={backHref} className="mb-6 flex w-fit items-center gap-1 text-sm text-muted hover:text-accent lg:mb-8">
        <span aria-hidden="true">←</span> Back to search
      </Link>

      <div className="lg:grid lg:grid-cols-[1fr_700px] lg:items-start lg:gap-8">
        <main className="flex min-w-0 flex-col gap-6">
          <header>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {listing.year} {listing.make} {listing.model}
            </h1>
            {listing.variant && <p className="text-sm text-muted">{listing.variant}</p>}
          </header>

          <ListingImage
            src={listing.imageUrl ?? undefined}
            fallbackSrc={getStockImageUrl(listing.make, listing.model, listing.year ?? undefined)}
            alt={`${listing.year ?? ""} ${listing.make} ${listing.model}`.trim()}
          />

          <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <div className="text-3xl font-extrabold accent-gradient-text">{formatCurrency(price)}</div>
              <div className="text-xs text-muted">asking price</div>
            </div>
            <div className="flex items-center gap-2">
              {isWatchlisted !== undefined && (
                <WatchlistButton listingId={listing.id} isWatchlisted={isWatchlisted} variant="button" />
              )}
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
          <OwnershipYearsSlider years={ownershipYears} />

          <details className="card group overflow-hidden" open>
            <summary className="flex cursor-pointer list-none select-none items-baseline justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 shrink-0 text-accent transition-transform group-open:rotate-90"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                </svg>
                <span className="group-open:hidden">{ownershipCost.ownershipYears}-year ownership costs</span>
                <span className="hidden group-open:inline">
                  How the {ownershipCost.ownershipYears}-year ownership cost is calculated
                </span>
              </span>
              <span className="text-lg font-extrabold accent-gradient-text">{formatCurrency(ownershipCost.total)}</span>
            </summary>
            <div className="border-t border-border px-4 pb-4 pt-3">
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
            </div>
          </details>
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
