"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { toggleWatchlistAction } from "@/lib/actions/watchlist";

/** Watchlist toggle. Used both inside ListingCard (which has a full-card
 * stretched Link underneath at z-0) and standalone on the detail page — the
 * stopPropagation/preventDefault below only matters for the card placement,
 * but is harmless standalone. */
export function WatchlistButton({
  listingId,
  isWatchlisted: initialIsWatchlisted,
  variant = "corner",
}: {
  listingId: number;
  isWatchlisted: boolean;
  /** "corner" for the folded-corner toggle on a ListingCard's top-left;
   * "button" for the labelled pill next to the detail page's "View on
   * {dealer}" CTA. */
  variant?: "corner" | "button";
}) {
  const [isWatchlisted, setIsWatchlisted] = useState(initialIsWatchlisted);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const previous = isWatchlisted;
    setIsWatchlisted(!previous);

    startTransition(async () => {
      const result = await toggleWatchlistAction(listingId, previous);
      if (!result.ok) {
        setIsWatchlisted(previous); // revert
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
        className={`btn ${isWatchlisted ? "btn-primary" : "btn-ghost"}`}
      >
        {isWatchlisted ? "★ Watchlisted" : "☆ Add to watchlist"}
      </button>
    );
  }

  // A dog-ear corner fold instead of a star: unfolded it's just a faint
  // crease in the card's top-left corner; clicking animates it folding over
  // into a solid accent triangle, and it stays folded while watchlisted.
  // Both triangle layers share the same 3-point clip-path shape (only the
  // percentages change), which is what lets the browser animate smoothly
  // between the two sizes via `transition-[clip-path]` — polygons with
  // different point counts can't be interpolated.
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={isWatchlisted}
      className="group absolute left-0 top-0 z-10 h-11 w-11 overflow-hidden rounded-tl-2xl"
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-full transition-[clip-path,background-color,opacity] duration-300 ease-out ${
          isWatchlisted
            ? "corner-fold opacity-100 [clip-path:polygon(0_0,100%_0,0_100%)]"
            : // Hidden until the card (not just this button) is hovered/
              // focused — a permanently-visible grey corner on every card
              // was noise, not a hint. group/card comes from ListingCard's
              // outer wrapper; the plain group-hover: below is this
              // button's own (nearest `group`), for the separate color/size
              // grow-on-hover effect once it's already visible.
              "bg-foreground/30 opacity-0 [clip-path:polygon(0_0,42%_0,0_42%)] group-hover/card:opacity-100 group-focus-visible:opacity-100 group-hover:bg-accent group-hover:[clip-path:polygon(0_0,60%_0,0_60%)]"
        }`}
      />
      {/* Shadow along the folded edge, for a lifted-paper look — only
          meaningfully visible once folded (fades in with the same timing). */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-full bg-gradient-to-br from-transparent via-transparent to-black/20 transition-opacity duration-300 ${
          isWatchlisted ? "opacity-100" : "opacity-0"
        }`}
        style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className={`absolute left-2 top-2 h-3 w-3 text-accent-foreground transition-opacity duration-200 ${
          isWatchlisted ? "opacity-100 delay-150" : "opacity-0"
        }`}
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 0 0-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 0 0-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 0 0-.363-1.118L2.062 9.385c-.784-.57-.38-1.81.588-1.81h4.163a1 1 0 0 0 .95-.69l1.286-3.958z" />
      </svg>
    </button>
  );
}
