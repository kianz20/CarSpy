/**
 * Dealer `region` values (see seedDealers.ts) are free text, not a
 * controlled vocabulary — some are a real NZ region ("Canterbury"), some are
 * a city/suburb ("Christchurch", "Wigram, Christchurch"), and some are a
 * comma/semicolon-separated list covering several locations at once
 * ("Panmure, Auckland; Wigram, Christchurch"). Left as-is, the search form's
 * Region dropdown ends up full of near-duplicate, ungrouped entries.
 *
 * This maps every token that currently appears in a dealer's raw region
 * string to the single official NZ region it belongs to, so the dropdown can
 * show a clean, deduplicated list of real regions and filtering can match a
 * dealer regardless of which city/suburb its raw value happens to use.
 */

// The 16 official NZ regions that actually show up (or could show up) across
// seeded dealers' raw region strings.
export const NZ_REGIONS = [
  "Northland",
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Gisborne",
  "Hawke's Bay",
  "Taranaki",
  "Manawatū-Whanganui",
  "Wellington",
  "Tasman",
  "Nelson",
  "Marlborough",
  "West Coast",
  "Canterbury",
  "Otago",
  "Southland",
] as const;

// City/suburb (and region-name) tokens, lowercased, mapped to their region.
// Extend this whenever a new dealer's raw region string introduces a token
// that isn't covered yet — parseDealerRegions() drops anything unrecognized
// rather than guessing.
const TOKEN_TO_REGION: Record<string, (typeof NZ_REGIONS)[number]> = {
  auckland: "Auckland",
  "north shore": "Auckland",
  onehunga: "Auckland",
  panmure: "Auckland",

  hamilton: "Waikato",
  cambridge: "Waikato",
  matamata: "Waikato",
  "te awamutu": "Waikato",
  thames: "Waikato",
  waikato: "Waikato",

  tauranga: "Bay of Plenty",
  "bay of plenty": "Bay of Plenty",

  feilding: "Manawatū-Whanganui",
  manawatu: "Manawatū-Whanganui",
  "manawatu-whanganui": "Manawatū-Whanganui",

  wellington: "Wellington",
  masterton: "Wellington", // Wairarapa is part of the Wellington region

  nelson: "Nelson",

  christchurch: "Canterbury",
  wigram: "Canterbury",
  sydenham: "Canterbury",
  timaru: "Canterbury",
  canterbury: "Canterbury",

  dunedin: "Otago",
  otago: "Otago",
};

// Raw values that describe *how* a dealer operates rather than *where* —
// not real regions, so they never appear in the Region dropdown.
const NON_REGION_VALUES = new Set(["national", "unknown"]);

/** True if a dealer's raw region value means "operates across NZ" rather
 * than naming a specific place — such a dealer's listings should show up
 * regardless of which region a search filters by. */
export function isNationwide(raw: string | null): boolean {
  return raw?.trim().toLowerCase() === "national";
}

/** Splits a dealer's raw region string into the distinct real NZ regions it
 * covers, deduplicated. Returns [] for null/"Unknown"/"National" (see
 * isNationwide for the last of those) or for any token this map doesn't
 * recognize yet. */
export function parseDealerRegions(raw: string | null): string[] {
  if (!raw) return [];
  const tokens = raw
    .split(/[,;]/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && !NON_REGION_VALUES.has(t));

  const regions = new Set<string>();
  for (const token of tokens) {
    const region = TOKEN_TO_REGION[token];
    if (region) regions.add(region);
  }
  return [...regions];
}
