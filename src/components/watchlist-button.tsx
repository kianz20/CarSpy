"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { toggleWatchlistAction } from "@/lib/actions/watchlist";

/** Star toggle for saving a listing. Used both inside ListingCard (which has
 * a full-card stretched Link underneath at z-0) and standalone on the detail
 * page — the stopPropagation/preventDefault below only matters for the card
 * placement, but is harmless standalone. */
export function WatchlistButton({
  listingId,
  isWatchlisted: initialIsWatchlisted,
  variant = "icon",
}: {
  listingId: number;
  isWatchlisted: boolean;
  /** "icon" for the small corner star on a ListingCard; "button" for the
   * labelled pill next to the detail page's "View on {dealer}" CTA. */
  variant?: "icon" | "button";
}) {
  const [isWatchlisted, setIsWatchlisted] = useState(initialIsWatchlisted);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const optimistic = !isWatchlisted;
    setIsWatchlisted(optimistic);

    startTransition(async () => {
      const result = await toggleWatchlistAction(listingId);
      if (!result.ok) {
        setIsWatchlisted(!optimistic); // revert
        if (result.error === "not_authenticated") router.push("/login");
        return;
      }
      setIsWatchlisted(result.isWatchlisted);
    });
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`btn ${isWatchlisted ? "btn-primary" : "btn-ghost"}`}
      >
        {isWatchlisted ? "★ Watchlisted" : "☆ Add to watchlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={isWatchlisted}
      className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/90 text-base leading-none shadow-sm backdrop-blur-sm transition-colors hover:border-accent/40"
    >
      <span className={isWatchlisted ? "text-accent" : "text-muted"}>{isWatchlisted ? "★" : "☆"}</span>
    </button>
  );
}
