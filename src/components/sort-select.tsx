"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "total", label: "Total cost (default)" },
  { value: "price", label: "Asking price" },
  { value: "mileage", label: "Mileage" },
] as const;

/** Standalone sort control for the results list — separate from SearchForm
 * (which only holds the actual match filters) since sort doesn't change
 * which listings match, just the order they're shown in. Navigates directly
 * via the router rather than a form submit, preserving every other current
 * search param. */
export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", event.target.value);
    // A different order can put page 5 past the end of the results (or just
    // show confusingly different listings there) — back to page 1.
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-muted">
      <span className="font-semibold">Sort by</span>
      <select value={current} onChange={handleChange} className="field w-auto py-1.5">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
