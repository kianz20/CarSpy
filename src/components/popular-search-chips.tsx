"use client";

import { useState } from "react";
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

/** Sidebar teaser for the pre-search home page, styled to match PriceDrops —
 * a fixed-width card of quick links sitting opposite it. Collapsed behind a
 * chevron toggle below the `lg` breakpoint only — on mobile this card sits
 * between the popular-search-chips-heavy form and the price-drops panel, so
 * collapsing it by default keeps the page from opening with a wall of chip
 * links before the actual search form; at `lg`+ there's room for it to just
 * stay open like before. */
export function PopularSearchChips({ financeEnabled }: { financeEnabled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left lg:pointer-events-none"
      >
        <h2 className="text-sm font-semibold">Popular searches</h2>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 shrink-0 text-muted transition-transform lg:hidden ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={`mt-3 flex-col gap-1 lg:flex ${open ? "flex" : "hidden"}`}>
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
