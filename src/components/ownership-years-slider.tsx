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
    <label className="card flex flex-col gap-2 p-4 text-sm">
      <span className="flex items-baseline justify-between">
        <span className="font-semibold">Ownership period</span>
        <span className="pill bg-accent/10 text-accent">
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
        className="w-full accent-accent"
      />
      <div className="flex justify-between text-[10px] text-muted">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </label>
  );
}
