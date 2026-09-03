import Link from "next/link";

type PopularSearch = {
  label: string;
  params: Record<string, string>;
};

/** Static seed list for the pre-search home page — there's no search-analytics
 * data yet to derive real "popular" searches from, so this is a hand-picked
 * set of common NZ-market picks (grep-friendly with `readonly` since nothing
 * mutates it) until enough usage data exists to replace it with a real query. */
const POPULAR_SEARCHES: readonly PopularSearch[] = [
  { label: "Toyota Corolla 2012+", params: { make: "Toyota", model: "Corolla", minYear: "2012" } },
  { label: "Suzuki Swift 2008–2015", params: { make: "Suzuki", model: "Swift", minYear: "2008", maxYear: "2015" } },
  { label: "Toyota RAV4 2002–2014", params: { make: "Toyota", model: "RAV4", minYear: "2002", maxYear: "2014" } },
  { label: "Ford Ranger 2016+", params: { make: "Ford", model: "Ranger", minYear: "2016" } },
  { label: "Nissan Leaf 2013–2019", params: { make: "Nissan", model: "Leaf", minYear: "2013", maxYear: "2019" } },
  { label: "Hybrid 2016+", params: { powertrain: "hybrid", minYear: "2016" } },
  { label: "Diesel Utes", params: { powertrain: "diesel", bodyType: "ute", minYear: "2000" } },
];

/** Sidebar teaser for the pre-search home page, styled to match
 * RecentPriceDrops — a fixed-width card of quick links sitting opposite it. */
export function PopularSearchChips({ financeEnabled }: { financeEnabled: boolean }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold">Popular searches</h2>
      <div className="flex flex-col gap-1">
        {POPULAR_SEARCHES.map((search) => {
          // hasSearched (page.tsx) only checks that financeEnabled is present
          // in the URL at all, not its value — but it still has to be *some*
          // value, and the user's own saved default is what a normal form
          // submit would send, so chips shouldn't silently override it.
          const query = new URLSearchParams({ ...search.params, financeEnabled: String(financeEnabled) });
          return (
            <Link
              key={search.label}
              href={`/?${query.toString()}`}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-accent"
            >
              {search.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
