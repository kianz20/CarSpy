"use client";

import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_YEARS = 3;

/** Lets a visitor on a listing page re-run the ownership-cost estimate over
 * a different horizon (1-5 years) instead of only ever seeing the fixed
 * 3-year figure. Navigates via the router (like InsuranceCoverToggle),
 * preserving every other current param. */
export function OwnershipYearsSlider({ years }: { years: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const value = event.target.value;
    if (Number(value) === DEFAULT_YEARS) params.delete("ownershipYears");
    else params.set("ownershipYears", value);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-baseline justify-between">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Ownership period</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {years} year{years === 1 ? "" : "s"}
        </span>
      </span>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={years}
        onChange={handleChange}
        className="w-full accent-foreground"
      />
    </label>
  );
}
