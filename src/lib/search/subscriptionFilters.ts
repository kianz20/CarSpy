import type { ListingSearchFilters } from "./listings";
import { formatCurrency, formatNumber } from "@/lib/format";

// Pure filter-formatting helpers with no DB access — kept separate from
// subscriptions.ts so a client component can import these without also
// pulling in that file's `db` import (which needs Node's `fs`/`postgres`
// and can't be bundled for the browser).

export type SubscriptionFrequency = "daily" | "weekly";

/** Canonical encoding of a filters object — sorted array values, empty/
 * undefined fields dropped — so two filter objects that mean the same
 * search always hash the same way regardless of array order or which
 * optional fields happen to be present. Used both for the DB's dedup index
 * and for "does this user already have this exact search saved". */
export function canonicalizeFilters(filters: ListingSearchFilters): string {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      normalized[key] = [...value].sort();
    } else {
      normalized[key] = value;
    }
  }
  return JSON.stringify(normalized);
}

/** One-line human label for a saved search — reused by the Settings list
 * and the alert email's subject/heading. Deliberately simple: just what
 * make/model was searched for, since that's what a user actually recognizes
 * their search by. */
export function describeFilters(filters: ListingSearchFilters): string {
  const parts: string[] = [];
  if (filters.make?.length) parts.push(filters.make.join("/"));
  if (filters.model?.length) parts.push(filters.model.join("/"));
  return parts.length > 0 ? parts.join(" ") : "your saved search";
}

/** Every active criterion as a short readable phrase, in a natural reading
 * order (what, then how, then range constraints) — used by the "get alerts"
 * modal's confirmation sentence, where the full picture of what's being
 * subscribed to matters more than brevity (unlike describeFilters' short
 * label for the Settings list row and email subject). */
export function describeFiltersDetailed(filters: ListingSearchFilters): string[] {
  const parts: string[] = [];
  if (filters.make?.length || filters.model?.length) {
    parts.push([...(filters.make ?? []), ...(filters.model ?? [])].join(" "));
  }
  if (filters.bodyType?.length) parts.push(filters.bodyType.join("/"));
  if (filters.powertrain?.length) parts.push(filters.powertrain.join("/"));
  if (filters.transmission?.length) parts.push(filters.transmission.join("/"));
  if (filters.region?.length) parts.push(filters.region.join("/"));
  if (filters.minYear !== undefined) parts.push(`min year ${filters.minYear}`);
  if (filters.maxYear !== undefined) parts.push(`max year ${filters.maxYear}`);
  if (filters.minPrice !== undefined) parts.push(`min price ${formatCurrency(filters.minPrice)}`);
  if (filters.maxPrice !== undefined) parts.push(`max price ${formatCurrency(filters.maxPrice)}`);
  if (filters.maxMileageKm !== undefined) parts.push(`max mileage ${formatNumber(filters.maxMileageKm)}km`);
  return parts;
}

/** Inverse of page.tsx's URL-param parsing — turns a stored filters object
 * back into the query string that reproduces it, for linking back to the
 * live search from the Settings list or an alert email. */
export function filtersToSearchParams(filters: ListingSearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.bodyType?.length) params.set("bodyType", filters.bodyType.join(","));
  if (filters.powertrain?.length) params.set("powertrain", filters.powertrain.join(","));
  if (filters.make?.length) params.set("make", filters.make.join(","));
  if (filters.model?.length) params.set("model", filters.model.join(","));
  if (filters.transmission?.length) params.set("transmission", filters.transmission.join(","));
  if (filters.region?.length) params.set("region", filters.region.join(","));
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.maxMileageKm !== undefined) params.set("maxMileageKm", String(filters.maxMileageKm));
  if (filters.minYear !== undefined) params.set("minYear", String(filters.minYear));
  if (filters.maxYear !== undefined) params.set("maxYear", String(filters.maxYear));
  if (filters.includeMotorcycles) params.set("includeMotorcycles", "true");
  // A saved search always implies a completed search — page.tsx keys
  // `hasSearched` on financeEnabled being present in the URL at all.
  params.set("financeEnabled", "false");
  return params;
}
