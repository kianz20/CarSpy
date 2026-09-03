import Link from "next/link";
import type { RecentPriceDrop } from "@/lib/search/listings";
import { formatCurrency } from "@/lib/format";
import { ListingImage } from "@/components/listing-image";
import { getStockImageUrl } from "@/lib/stockImage";

/** Teaser panel for the pre-search home page — a handful of listings that
 * just got cheaper, so there's something to look at (and a reason to click
 * in) before the visitor has picked any filters yet. */
export function RecentPriceDrops({ drops }: { drops: RecentPriceDrop[] }) {
  if (drops.length === 0) return null;

  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold">Recent price drops</h2>
      <div className="flex flex-col gap-2">
        {drops.map((drop) => {
          const amount = drop.previousPrice - drop.price;
          const alt = `${drop.year ?? ""} ${drop.make} ${drop.model}`.trim();
          return (
            <Link
              key={drop.id}
              href={`/listing/${drop.id}`}
              className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-surface-2"
            >
              <ListingImage
                src={drop.imageUrl ?? undefined}
                fallbackSrc={getStockImageUrl(drop.make, drop.model, drop.year ?? undefined)}
                alt={alt}
                compact
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{alt}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold">{formatCurrency(drop.price)}</span>
                  <span className="pill bg-emerald-500/12 text-[10px] text-emerald-600 dark:text-emerald-400">
                    ↓ {formatCurrency(amount)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
