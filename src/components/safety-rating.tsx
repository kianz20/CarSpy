// Same star glyph WatchlistButton uses (viewBox 0 0 20 20), reused here so
// the two star renderings in the app look identical.
const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 0 0-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 0 0-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 0 0-.363-1.118L2.062 9.385c-.784-.57-.38-1.81.588-1.81h4.163a1 1 0 0 0 .95-.69l1.286-3.958z";

/** One star, filled left-to-right by `fillFraction` (0–1) — an outline star
 * with a width-clipped solid star overlaid on top, which is what lets a
 * half-star (fillFraction 0.5) render as a half-filled star rather than
 * rounding to a whole star on or off. */
function Star({ fillFraction }: { fillFraction: number }) {
  return (
    <span className="relative inline-block h-4 w-4 shrink-0">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="absolute inset-0 h-4 w-4 text-foreground/15">
        <path d={STAR_PATH} />
      </svg>
      {fillFraction > 0 && (
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillFraction * 100}%` }}>
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-amber-500">
            <path d={STAR_PATH} />
          </svg>
        </span>
      )}
    </span>
  );
}

/**
 * Visual 0–5 star safety rating (ANCAP/UCSR/VSRR, from VEEEL — see
 * vehicleSpecMatch.ts) with an (i) affordance that reveals which specific
 * rating/test it's based on, on hover or keyboard focus — the rating body
 * varies per model/year and VEEEL's terms require showing it alongside any
 * displayed star rating, so it's one tap/hover away rather than baked into
 * the row as running text.
 */
export function SafetyRating({ stars, testLabel }: { stars: number; testLabel?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} fillFraction={Math.min(Math.max(stars - i, 0), 1)} />
        ))}
      </div>
      <span className="sr-only">
        {stars} out of 5 stars{testLabel ? ` — ${testLabel}` : ""}
      </span>
      {testLabel && (
        <div className="group/tip relative inline-flex">
          <button
            type="button"
            aria-label={`Safety rating source: ${testLabel}`}
            className="flex h-4 w-4 items-center justify-center rounded-full border border-muted/40 text-[10px] font-semibold leading-none text-muted hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent focus-visible:outline-none"
          >
            i
          </button>
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[14rem] -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-normal normal-case text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
          >
            {testLabel}
          </div>
        </div>
      )}
    </div>
  );
}
