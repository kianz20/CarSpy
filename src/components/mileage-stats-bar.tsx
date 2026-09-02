import type { MileageBracketStat } from "@/lib/search/mileageStats";
import { formatCurrency } from "@/lib/format";

const BRACKET_ACCENT: Record<string, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
};

/**
 * Shows what a low/medium/high mileage example currently costs, computed
 * only from listings matching the active search — not a fair-value verdict
 * (Phase 5's valuation/ranking engine was deliberately skipped for now).
 * This is context for comparing a listing's price against others like it,
 * nothing more.
 */
export function MileageStatsBar({ stats }: { stats: MileageBracketStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.bracket} className="card relative overflow-hidden p-4">
          <span className={`absolute inset-y-0 left-0 w-1 ${BRACKET_ACCENT[s.bracket] ?? "bg-accent"}`} aria-hidden="true" />
          <div className="text-xs font-semibold text-muted">
            {s.label} <span className="font-normal">({s.rangeLabel})</span>
          </div>
          <div className="mt-1 text-xl font-extrabold">
            {s.averagePrice !== null ? formatCurrency(s.averagePrice) : "—"}
          </div>
          <div className="text-xs text-muted">
            {s.count === 0 ? "no matches" : `avg. of ${s.count} listing${s.count === 1 ? "" : "s"}`}
          </div>
        </div>
      ))}
    </div>
  );
}
