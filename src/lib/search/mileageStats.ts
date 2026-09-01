/**
 * Mileage-bracketed average price, computed only from listings currently
 * matching the user's search — not a valuation model (Phase 5 was
 * deliberately skipped for now, per the decision to ship something useful
 * sooner rather than build depreciation curves/comparables scoring first).
 * This answers a narrower, honestly-scoped question: "of the cars matching
 * my search right now, what does a low/medium/high mileage example
 * typically cost?" — context for a listing's price, not a fair-value verdict.
 */

export type MileageBracketKey = "low" | "medium" | "high";

export type MileageBracketStat = {
  bracket: MileageBracketKey;
  label: string;
  rangeLabel: string;
  count: number;
  averagePrice: number | null;
};

export const BRACKET_DEFS: { bracket: MileageBracketKey; label: string; rangeLabel: string; maxKm: number }[] = [
  { bracket: "low", label: "Low mileage", rangeLabel: "under 60,000 km", maxKm: 60000 },
  { bracket: "medium", label: "Medium mileage", rangeLabel: "60,000–120,000 km", maxKm: 120000 },
  { bracket: "high", label: "High mileage", rangeLabel: "over 120,000 km", maxKm: Infinity },
];

function bracketFor(mileageKm: number): MileageBracketKey {
  if (mileageKm < 60000) return "low";
  if (mileageKm <= 120000) return "medium";
  return "high";
}

/**
 * Fixed brackets (not terciles of the current result set) so the meaning of
 * "low mileage" stays consistent whether a search returns 3 listings or 300,
 * and so a single listing's own mileage can be compared against the same
 * scale shown here.
 */
export function computeMileagePriceStats(items: { mileageKm: number | null; price: number }[]): MileageBracketStat[] {
  const grouped = new Map<MileageBracketKey, number[]>();

  for (const item of items) {
    if (item.mileageKm === null || item.mileageKm === undefined) continue;
    const bracket = bracketFor(item.mileageKm);
    const prices = grouped.get(bracket) ?? [];
    prices.push(item.price);
    grouped.set(bracket, prices);
  }

  return BRACKET_DEFS.map(({ bracket, label, rangeLabel }) => {
    const prices = grouped.get(bracket) ?? [];
    const averagePrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : null;
    return { bracket, label, rangeLabel, count: prices.length, averagePrice };
  });
}
