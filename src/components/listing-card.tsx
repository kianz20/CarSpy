import Link from "next/link";
import type { OwnershipCostBreakdown } from "@/lib/ownership";
import type { FirstSeenPrice } from "@/lib/search/listings";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { ListingImage } from "@/components/listing-image";
import { getStockImageUrl } from "@/lib/stockImage";
import { WatchlistButton } from "@/components/watchlist-button";

export type ListingCardData = {
  id: number;
  url: string;
  make: string;
  model: string;
  year: number | null;
  variant: string | null;
  transmission: string | null;
  bodyType: string | null;
  powertrain: string | null;
  engine: string | null;
  mileageKm: number | null;
  importStatus: string | null;
  price: number;
  dealerName: string;
  dealerRegion: string | null;
  imageUrl: string | null;
};

const POWERTRAIN_PILL: Record<string, string> = {
  ev: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  phev: "bg-teal-500/12 text-teal-600 dark:text-teal-400",
  hybrid: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-400",
  diesel: "bg-orange-500/12 text-orange-600 dark:text-orange-400",
  petrol: "bg-surface-2 text-muted",
};

export function ListingCard({
  listing,
  ownershipCost,
  detailHref,
  isWatchlisted,
  firstSeenPrice,
}: {
  listing: ListingCardData;
  ownershipCost: OwnershipCostBreakdown;
  /** Internal `/listing/[id]` link, carrying the search's deposit/annualKm
   * along so the detail page's cost breakdown matches what's shown here. */
  detailHref: string;
  /** Undefined when there's no signed-in user to check a watchlist for —
   * omits the star entirely rather than showing one that can't do anything. */
  isWatchlisted?: boolean;
  /** The earliest recorded price (+ date) for this listing (see
   * getFirstSeenPrices) — only rendered as a badge when the price is
   * actually higher than the current price, i.e. a genuine drop. */
  firstSeenPrice?: FirstSeenPrice;
}) {
  const priceDrop =
    firstSeenPrice !== undefined ? firstSeenPrice.price - listing.price : 0;

  return (
    <div className="card card-hover group/card relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Stretched-link pattern — makes the whole card clickable without
          nesting an <a> inside another <a> (the outbound dealer link below
          needs its own, separately-clickable anchor). */}
      <Link
        href={detailHref}
        className="absolute inset-0 z-0"
        aria-label={`${listing.year ?? ""} ${listing.make} ${listing.model}`.trim()}
      />

      {isWatchlisted !== undefined && (
        <WatchlistButton listingId={listing.id} isWatchlisted={isWatchlisted} />
      )}

      <div className="flex min-w-0 gap-4">
        <ListingImage
          src={listing.imageUrl ?? undefined}
          fallbackSrc={getStockImageUrl(
            listing.make,
            listing.model,
            listing.year ?? undefined,
          )}
          alt={`${listing.year ?? ""} ${listing.make} ${listing.model}`.trim()}
          compact
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-base font-semibold sm:text-lg">
              {listing.year ?? ""} {listing.make} {listing.model}
            </span>
            {listing.importStatus && (
              <span className="pill bg-surface-2 text-muted">
                {listing.importStatus === "nz_new" ? "NZ new" : "Import"}
              </span>
            )}
          </div>
          {listing.variant && (
            <div className="truncate text-sm text-muted">{listing.variant}</div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {listing.mileageKm !== null && (
              <span className="pill bg-surface-2 text-muted">
                {listing.mileageKm === 0
                  ? "New"
                  : `${formatNumber(listing.mileageKm)} km`}
              </span>
            )}
            {listing.transmission && (
              <span className="pill bg-surface-2 text-muted capitalize">
                {listing.transmission}
              </span>
            )}
            {listing.powertrain && (
              <span
                className={`pill capitalize ${POWERTRAIN_PILL[listing.powertrain] ?? "bg-surface-2 text-muted"}`}
              >
                {listing.powertrain}
              </span>
            )}
            {listing.bodyType && (
              <span className="pill bg-surface-2 text-muted capitalize">
                {listing.bodyType.replace("_", " ")}
              </span>
            )}
          </div>
          <div className="mt-1.5 truncate text-xs text-muted">
            {listing.dealerName}
            {listing.dealerRegion ? ` — ${listing.dealerRegion}` : ""} ·{" "}
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 hover:text-accent hover:underline"
            >
              view on dealer site ↗
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-3 border-t border-border pt-3 sm:border-t-0 sm:pt-0 sm:text-right">
        <div className="flex flex-1 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
          <div>
            <div className="flex items-center gap-1.5 sm:justify-end">
              {priceDrop > 0 && firstSeenPrice && (
                // Expands when the *card* (not just the chip) is hovered to
                // name the date the drop is measured from — the short form
                // alone doesn't say "less than what". max-width (not width)
                // is what's animatable here since the content's natural
                // size isn't known upfront. group/card comes from the outer
                // card div (shared with the watchlist corner's hover-hint).
                <span className="pill max-w-[4.5rem] overflow-hidden whitespace-nowrap bg-emerald-500/12 text-emerald-600 transition-[max-width] duration-300 ease-out group-hover/card:max-w-[16rem] dark:text-emerald-400">
                  ↓ {formatCurrency(priceDrop)}
                  <span className="ml-1 opacity-0 transition-opacity delay-100 duration-200 group-hover/card:opacity-100">
                    less than {formatDate(firstSeenPrice.observedAt)}
                  </span>
                </span>
              )}
              <div className="text-2xl font-extrabold">
                {formatCurrency(listing.price)}
              </div>
            </div>
            <div className="text-xs text-muted">asking price</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-accent">
              {formatCurrency(ownershipCost.total)}
            </div>
            <div className="text-xs text-muted">
              {ownershipCost.ownershipYears === 1
                ? "Annual maintenance cost"
                : `Cost to own over ${ownershipCost.ownershipYears} years`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
