"use client";

import { useState } from "react";

/**
 * Prefers the dealer's own hotlinked listing photo; falls back to the
 * make/model/year stock photo (imagin.studio) if there isn't one or it
 * fails to load, and hides itself entirely if even that fails (e.g. the CDN
 * being unreachable) rather than showing a broken-image icon.
 */
export function ListingImage({
  src,
  fallbackSrc,
  alt,
  /** Compact mode for the results list — fixed small size, no caption
   * (there's no room for it next to a card's other details). */
  compact = false,
}: {
  src?: string;
  fallbackSrc: string;
  alt: string;
  compact?: boolean;
}) {
  const [usedFallback, setUsedFallback] = useState(!src);
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const currentSrc = usedFallback ? fallbackSrc : (src as string);

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- external, dynamically-built URL (dealer hotlink or CDN); not a local/optimizable asset
    <img
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (!usedFallback) setUsedFallback(true);
        else setFailed(true);
      }}
      className={
        compact
          ? "h-20 w-28 shrink-0 rounded-lg border border-border bg-surface-2 object-cover"
          : "mx-auto max-h-[40rem] w-auto max-w-full rounded-xl border border-border bg-surface-2 object-contain"
      }
    />
  );

  if (compact) return image;

  return (
    <div className="flex flex-col gap-1">
      {image}
      {usedFallback && (
        <p className="text-center text-[11px] text-muted">Representative photo, not the actual vehicle</p>
      )}
    </div>
  );
}
