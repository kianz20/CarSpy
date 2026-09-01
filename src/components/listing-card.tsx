import Link from "next/link";
import type { OwnershipCostBreakdown } from "@/lib/ownership";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ListingImage } from "@/components/listing-image";
import { getStockImageUrl } from "@/lib/stockImage";

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
  mileageKm: number | null;
  importStatus: string | null;
  price: number;
  dealerName: string;
  dealerRegion: string | null;
  imageUrl: string | null;
};

export function ListingCard({
  listing,
  ownershipCost,
  detailHref,
}: {
  listing: ListingCardData;
  ownershipCost: OwnershipCostBreakdown;
  /** Internal `/listing/[id]` link, carrying the search's deposit/annualKm
   * along so the detail page's cost breakdown matches what's shown here. */
  detailHref: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <ListingImage
          src={listing.imageUrl ?? undefined}
          fallbackSrc={getStockImageUrl(listing.make, listing.model, listing.year ?? undefined)}
          alt={`${listing.year ?? ""} ${listing.make} ${listing.model}`.trim()}
          compact
        />
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link href={detailHref} className="text-lg font-semibold hover:underline">
              {listing.year ?? ""} {listing.make} {listing.model}
            </Link>
            {listing.importStatus && (
              <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {listing.importStatus === "nz_new" ? "NZ new" : "Import"}
              </span>
            )}
          </div>
          {listing.variant && <div className="text-sm text-zinc-500 dark:text-zinc-400">{listing.variant}</div>}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {listing.mileageKm !== null && (
              <span>{listing.mileageKm === 0 ? "New" : `${formatNumber(listing.mileageKm)} km`}</span>
            )}
            {listing.transmission && <span className="capitalize">{listing.transmission}</span>}
            {listing.powertrain && <span className="capitalize">{listing.powertrain}</span>}
            {listing.bodyType && <span className="capitalize">{listing.bodyType.replace("_", " ")}</span>}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {listing.dealerName}
            {listing.dealerRegion ? ` — ${listing.dealerRegion}` : ""} ·{" "}
            <a href={listing.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              view on dealer site ↗
            </a>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-2xl font-bold">{formatCurrency(listing.price)}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">asking price</div>
        <div className="mt-2 text-sm font-medium">{formatCurrency(ownershipCost.total)}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">est. {ownershipCost.ownershipYears}-year ownership cost</div>
      </div>
    </div>
  );
}
