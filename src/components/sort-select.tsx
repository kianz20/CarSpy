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
    router.push(`/?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="font-medium">Sort by</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-black"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
