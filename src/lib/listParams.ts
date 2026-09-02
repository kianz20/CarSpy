/** Shared encoding for multi-value filter params: a single comma-separated
 * URL param (e.g. `?bodyType=ute,suv`) rather than repeated same-name
 * params — keeps every existing `Record<string,string>`-based helper
 * (Pagination, detailHref, Clear filters) working untouched, since each
 * multi-select field is still just one flat string in that record. Used by
 * both page.tsx (server) and search-form.tsx (client). */
export function parseListParam(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toListParam(values: string[]): string {
  return values.join(",");
}
