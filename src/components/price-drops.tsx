"use client";

import { useState } from "react";
import Link from "next/link";
import type { RecentPriceDrop } from "@/lib/search/listings";
import { formatCurrency } from "@/lib/format";
import { ListingImage } from "@/components/listing-image";
import { getStockImageUrl } from "@/lib/stockImage";

type Tab = "recent" | "biggest";

/** Teaser panel for the pre-search home page — a handful of listings that
 * just got cheaper, so there's something to look at (and a reason to click
 * in) before the visitor has picked any filters yet. Toggles between the
 * most recently-changed prices and the largest drops since first listed,
 * both fetched up front (see page.tsx) so switching tabs is instant rather
 * than triggering another server round trip. */
export function PriceDrops({
  recent,
  biggest,
}: {
  recent: RecentPriceDrop[];
  biggest: RecentPriceDrop[];
}) {
  // Default to whichever tab actually has something to show — a listing
  // detail page badge already covers "recent" drops elsewhere, so if this
  // Neon/RDS's price history happens to be too sparse for "recent" hits
  // yet, "biggest" still gives the panel something to display.
  const [tab, setTab] = useState<Tab>(recent.length > 0 ? "recent" : "biggest");
  const drops = tab === "recent" ? recent : biggest;

  if (recent.length === 0 && biggest.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Price drops</h2>
        <div className="flex gap-1 rounded-full bg-surface-2 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("recent")}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              tab === "recent"
                ? "bg-surface shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Recent
          </button>
          <button
            type="button"
            onClick={() => setTab("biggest")}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              tab === "biggest"
                ? "bg-surface shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Biggest drop
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {drops.length === 0 && (
          <p className="px-1.5 py-2 text-xs text-muted">
            Nothing to show here yet.
          </p>
        )}
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
                fallbackSrc={getStockImageUrl(
                  drop.make,
                  drop.model,
                  drop.year ?? undefined,
                )}
                alt={alt}
                compact
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{alt}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold">
                    {formatCurrency(drop.price)}
                  </span>
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
