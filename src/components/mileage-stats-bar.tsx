import type { MileageBracketStat } from "@/lib/search/mileageStats";
import { formatCurrency } from "@/lib/format";

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
        <div key={s.bracket} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {s.label} <span className="font-normal">({s.rangeLabel})</span>
          </div>
          <div className="mt-1 text-xl font-semibold">
            {s.averagePrice !== null ? formatCurrency(s.averagePrice) : "—"}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {s.count === 0 ? "no matches" : `avg. of ${s.count} listing${s.count === 1 ? "" : "s"}`}
          </div>
        </div>
      ))}
    </div>
  );
}
