import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { listings } from "@/db/schema";

/**
 * A handful of makes where the most-common casing in scraped data is
 * actually the *wrong* one (an internal capital the majority-count heuristic
 * below can't discover on its own) — e.g. most dealers write "Ssangyong",
 * but the brand is "SsangYong". Keyed lowercase; only needed for the rare
 * case where popularity and correctness disagree.
 */
const CASING_OVERRIDES: Record<string, string> = {
  ssangyong: "SsangYong",
  mclaren: "McLaren",
  smart: "Smart",
};

/** Collapses casing AND punctuation/whitespace differences into one lookup
 * key, so "Mercedes Benz" and "Mercedes-Benz" group as the same brand. */
export function normalizeKey(make: string): string {
  return make
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // "ŠKODA" -> "skoda", not a separate brand
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Builds a lowercase-make → canonical-casing map from what's already in the
 * DB, so dealer feeds that render the same brand differently (Motorcentral's
 * "TOYOTA" vs another platform's "Toyota") converge on one casing instead of
 * fragmenting the make dropdown/filter into duplicate entries. Canonical
 * picks the casing with the most existing listings (self-correcting as data
 * accumulates), overridden for the few brands where that heuristic would
 * pick a factually wrong spelling (see CASING_OVERRIDES).
 */
export async function getCanonicalMakeMap(): Promise<Map<string, string>> {
  const rows = await db
    .select({ make: listings.make, count: sql<number>`count(*)` })
    .from(listings)
    .groupBy(listings.make);

  const byLower = new Map<string, { make: string; count: number }>();
  for (const row of rows) {
    // Strips spaces/hyphens too, not just case — otherwise "Mercedes Benz"
    // and "Mercedes-Benz" are treated as different brands instead of the
    // same one spelled two ways.
    const key = normalizeKey(row.make);
    // count(*) comes back from postgres.js as a string (bigint), not a
    // number — comparing those unconverted is a lexicographic string
    // compare (e.g. "8" > "1206"), which silently picked the wrong casing
    // as "canonical" for nearly every multi-digit group.
    const count = Number(row.count);
    const existing = byLower.get(key);
    if (!existing || count > existing.count) byLower.set(key, { make: row.make, count });
  }

  const canonical = new Map<string, string>();
  for (const [key, { make }] of byLower) canonical.set(key, CASING_OVERRIDES[key] ?? make);
  return canonical;
}

/** Resolves a freshly-scraped make against the canonical map, falling back
 * to the raw value unchanged when it's a brand not seen before — nothing to
 * converge on yet, and guessing at capitalization risks mangling a genuine
 * acronym (e.g. "BAIC", "LDV") that happens to only be one word. */
export function resolveMakeCasing(rawMake: string, canonicalMakes: ReadonlyMap<string, string>): string {
  return canonicalMakes.get(normalizeKey(rawMake)) ?? rawMake;
}
