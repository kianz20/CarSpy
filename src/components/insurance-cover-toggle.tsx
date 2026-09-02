"use client";

import { useRouter } from "next/navigation";
import type { InsuranceCoverType } from "@/lib/ownership";

/**
 * Lets a visitor landing directly on a listing page (no search form in
 * sight) switch the insurance assumption without going back to "/". Updates
 * the same `insuranceCoverType` query param the search form writes, so both
 * entry points stay in sync.
 */
export function InsuranceCoverToggle({
  coverType,
  searchParams,
}: {
  coverType: InsuranceCoverType;
  /** Current URL search params (deposit/annualKm/etc.) to preserve when toggling. */
  searchParams: Record<string, string>;
}) {
  const router = useRouter();

  function setCoverType(next: InsuranceCoverType) {
    const params = new URLSearchParams(searchParams);
    if (next === "comprehensive") {
      params.delete("insuranceCoverType");
    } else {
      params.set("insuranceCoverType", next);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold text-muted">Insurance cover:</span>
      <div className="flex overflow-hidden rounded-full border border-border">
        {(
          [
            { value: "comprehensive", label: "Comprehensive" },
            { value: "third_party_fire_theft", label: "Third party, fire & theft" },
            { value: "none", label: "None" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setCoverType(option.value)}
            aria-pressed={coverType === option.value}
            className={`px-2.5 py-1 font-medium transition-colors ${
              coverType === option.value
                ? "bg-gradient-to-br from-accent to-accent-2 text-accent-foreground"
                : "bg-transparent text-muted hover:bg-surface-2"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
