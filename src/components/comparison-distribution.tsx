"use client";

type DistributionBarProps = {
  label: string;
  /** Which metric this bar shows — picks the wording for the cheapest/most
   * expensive vs lowest/highest mileage edge-case sentences. */
  metric: "price" | "mileage";
  /** Make + model shown in the edge-case sentences, e.g. "Toyota Corolla". */
  model: string;
  min: number;
  max: number;
  avg: number;
  current: number;
  currentFormatted: string;
  avgFormatted: string;
  minFormatted: string;
  maxFormatted: string;
  /** Number of similar listings the min/avg/max were computed from. With
   * only one, min/avg/max are all the same value, which makes both the
   * position on the range and the "% above/below average" figures
   * meaningless, so the bar is dropped and only a sentence is shown. */
  count: number;
};

/** Keep an absolutely-positioned label from hanging off either end of the
 * track — at 0% or 100% a centred label would be half-clipped. */
function clampLabelPosition(percent: number) {
  return Math.min(92, Math.max(8, percent));
}

/** Plain-English version of "you are N% of the way through the range" —
 * driven by distance from the average (in %), the same comparison the chip
 * above uses, rather than raw position in the min–max range. Those two can
 * disagree on a skewed distribution: a few high outliers stretch the range
 * so a listing sits in the "cheaper than most" third by range position while
 * still being above average, which reads as a contradiction. */
function positionSentence(pctFromAvg: number, isAbove: boolean, isBelow: boolean, metric: "price" | "mileage") {
  const cheaper = metric === "price" ? "Cheaper" : "Lower mileage";
  const pricier = metric === "price" ? "Pricier" : "Higher mileage";

  if (isBelow) {
    if (pctFromAvg >= 20) return `${cheaper} than most`;
    return `${cheaper} than average`;
  }
  if (isAbove) {
    if (pctFromAvg >= 20) return `${pricier} than most`;
    return `${pricier} than average`;
  }
  return "Right at the average";
}

export function DistributionBar({
  label,
  metric,
  model,
  min,
  max,
  avg,
  current,
  currentFormatted,
  avgFormatted,
  minFormatted,
  maxFormatted,
  count,
}: DistributionBarProps) {
  const isBelow = current < avg;
  const isAbove = current > avg;
  const hasRange = max > min;

  // Both metrics read the same way: under the average is the good news.
  const stateColor = isBelow
    ? "var(--color-success)"
    : isAbove
      ? "var(--color-warning)"
      : "var(--color-info)";

  const toPercent = (value: number) =>
    hasRange ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 50;
  const currentPercent = toPercent(current);
  const avgPercent = toPercent(avg);

  const isCheapestOrLowest = hasRange && current <= min;
  const isMostExpensiveOrHighest = hasRange && current >= max;

  const summary = isCheapestOrLowest
    ? metric === "price"
      ? `This is the cheapest ${model} being sold — others go up to ${maxFormatted}`
      : `This is the lowest mileage ${model} being sold — others go up to ${maxFormatted}`
    : isMostExpensiveOrHighest
      ? metric === "price"
        ? `This is the most expensive ${model} being sold — others start from ${minFormatted}`
        : `This is the highest mileage ${model} being sold — others start from ${minFormatted}`
      : hasRange
        ? `${positionSentence(
            avg === 0 ? 0 : (Math.abs(current - avg) / avg) * 100,
            isAbove,
            isBelow,
            metric,
          )} — similar listings are between ${minFormatted} and ${maxFormatted}`
        : count > 1
          ? `Based on ${count - 1} other similar ${count - 1 === 1 ? "listing" : "listings"}, all at ${avgFormatted}`
          : "No other similar listings to compare against yet";

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-surface-2/50 px-5 py-4">
      {/* Headline: this listing's value, and how far it sits from average */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <span className="block text-sm font-semibold text-muted">{label}</span>
          <span className="text-2xl font-bold text-accent">{currentFormatted}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 self-center rounded-full px-3 py-1 text-sm font-semibold ${
            isBelow
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : isAbove
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
          }`}
        >
          <span aria-hidden>{isBelow ? "↓" : isAbove ? "↑" : "="}</span>
          <span>
            {isBelow
              ? `${(((avg - current) / avg) * 100).toFixed(0)}% below average`
              : isAbove
                ? `${(((current - avg) / avg) * 100).toFixed(0)}% above average`
                : "At average"}
          </span>
        </div>
      </div>

      {hasRange && (
        <div>
          {/* Average marker label, above the track */}
          <div className="relative h-5">
            <span
              className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] text-muted"
              style={{ left: `${clampLabelPosition(avgPercent)}%` }}
            >
              Average {avgFormatted}
            </span>
          </div>

          <div
            className="relative h-2.5 rounded-full"
            role="img"
            aria-label={`${label} ${currentFormatted}. Similar listings range from ${minFormatted} to ${maxFormatted}, averaging ${avgFormatted}.`}
            style={{
              background: "color-mix(in oklab, var(--color-accent) 18%, var(--color-surface))",
            }}
          >
            {/* Average tick */}
            <div
              className="absolute -top-1 h-[18px] w-0.5 -translate-x-1/2 rounded-full bg-muted/70"
              style={{ left: `${avgPercent}%` }}
            />
            {/* This listing */}
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${currentPercent}%`,
                background: stateColor,
                boxShadow: "0 0 0 3px var(--color-surface)",
              }}
            />
          </div>

          {/* "This listing" label, below the dot */}
          <div className="relative h-5">
            <span
              className="absolute mt-1.5 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold"
              style={{ left: `${clampLabelPosition(currentPercent)}%`, color: stateColor }}
            >
              This listing
            </span>
          </div>

          {/* Range ends */}
          <div className="flex items-baseline justify-between gap-4 text-[11px] text-muted">
            <span>
              <span className="font-semibold text-foreground">{minFormatted}</span>{" "}
              {metric === "price" ? "cheapest" : "lowest"}
            </span>
            <span className="text-right">
              <span className="font-semibold text-foreground">{maxFormatted}</span>{" "}
              {metric === "price" ? "priciest" : "highest"}
            </span>
          </div>
        </div>
      )}

      <p className="border-t border-border/30 pt-3 text-sm text-muted">{summary}</p>
    </div>
  );
}
