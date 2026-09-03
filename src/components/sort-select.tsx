"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SelectField } from "@/components/select-field";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "total", label: "Total cost (default)" },
  { value: "price", label: "Asking price" },
  { value: "mileage", label: "Mileage" },
];

/** Standalone sort control for the results list — separate from SearchForm
 * (which only holds the actual match filters) since sort doesn't change
 * which listings match, just the order they're shown in. Navigates directly
 * via the router rather than a form submit, preserving every other current
 * search param. */
export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // router.push alone gives no feedback while the new sort order's data
  // loads — wrapping it in a transition surfaces that wait as isPending,
  // same as Next's own loading.tsx does for a full navigation.
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    // A different order can put page 5 past the end of the results (or just
    // show confusingly different listings there) — back to page 1.
    params.delete("page");
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-muted">
      <span className="font-semibold">Sort by</span>
      <SelectField
        value={current}
        onChange={handleChange}
        options={SORT_OPTIONS}
        showPlaceholderOption={false}
        className="w-auto py-1.5"
      />
      {isPending && <Spinner />}
    </label>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 shrink-0 animate-spin text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
