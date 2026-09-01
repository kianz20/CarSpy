import { CRAWLER_USER_AGENT } from "../robots";
import type { NormalizedListing } from "../types";
import { normalizeBodyType, normalizePowertrain, normalizeTransmission } from "../normalize";

/**
 * Bespoke scraper for Armstrong's Motor Group (armstrongs.co.nz) — see
 * PLAN.md §3c. This one turned into a genuinely different story than the
 * other adapters: their `/our-vehicles/` page and every dealership sub-page
 * defer entirely to a third-party widget on a CNAME-cloaked subdomain that
 * returns empty to a plain fetch, and rendering it with a headless browser
 * gets an outright 403 from their WAF — active bot detection targeting
 * automation specifically, not a passive robots.txt preference. That would
 * have been a dead end (see PLAN.md's "investigated, blocked, deprioritized"
 * note), but the user found a way in: `/content/json/vehicles.json`, a
 * public, unauthenticated ~17MB JSON dump of the dealer group's ENTIRE
 * inventory (1,396 records at time of writing) straight from their DMS
 * export — no WAF, no widget, no pagination, one plain GET. robots.txt
 * doesn't disallow it, and they publish a `sitemap-vehicles.xml` alongside
 * it, both signals this feed is meant to be fetched.
 *
 * Bonus find: one record's `@LISTING_CIN_URL` field points at
 * `dataapi.autoplay.co.nz` — the same "AutoPlay" product behind the
 * AdTorque Edge adapter (Andrew Simms). Armstrong's runs on the same
 * underlying platform; it just exposes a raw data export instead of
 * (or in addition to) the page-scraping surface AdTorque Edge sites usually
 * offer, and guards its *rendered pages* far more aggressively than Andrew
 * Simms does. Different adapter needed either way, since the export's
 * `@LISTING_*` field format has nothing in common with AdTorque Edge's
 * schema.org markup.
 *
 * URL construction: the real detail URL includes a dealership-name path
 * segment (from `sitemap-vehicles.xml`, e.g.
 * `/our-vehicles/make-x/model-y/dealership-z/used-vehicle/{id}`) that isn't
 * cleanly derivable from this feed's yard-name field (values like "Used
 * Vehicles" or "APD Used" don't match the sitemap's dealership slugs).
 * Tested and confirmed the site 302-redirects to the canonical URL even
 * with a wrong or omitted dealership segment — routing only cares about the
 * trailing numeric ID — so that segment is left out rather than guessed.
 */

async function fetchJson(url: string): Promise<unknown[]> {
  const res = await fetch(url, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
  if (!res.ok) throw new Error(`Fetch failed for ${url}: HTTP ${res.status}`);
  return res.json();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type ArmstrongsRecord = Record<string, string> & {
  Images?: { Image?: { "@url"?: string }[] | { "@url"?: string } };
};

/** The feed's Images.Image is an array normally, but a single-image listing
 * collapses it to a bare object instead (typical of XML-to-JSON conversion) —
 * handle both shapes rather than assuming it's always an array. */
function firstImageUrl(record: ArmstrongsRecord): string | undefined {
  const image = record.Images?.Image;
  if (!image) return undefined;
  return Array.isArray(image) ? image[0]?.["@url"] : image["@url"];
}

function parseRecord(record: ArmstrongsRecord, origin: string): NormalizedListing | undefined {
  // Only used stock — this feed also carries new and demo vehicles, out of
  // scope for a used-car deal-finder (see PLAN.md §1).
  if (record["@LISTING_NEW"] === "True" || record["@LISTING_DEMO"] === "True") return undefined;

  const externalId = record["@LISTING_SEQ"];
  const make = record["@LISTING_MAKE"];
  const model = record["@LISTING_MODEL"];
  const price = parseFloat(record["@LISTING_PRICE"] ?? "0");
  // Price-On-Application listings (price "0") have no stated asking price —
  // same reasoning as skipping Turners' un-bid auction listings.
  if (!externalId || !make || !model || !price) return undefined;

  const year = parseInt(record["@LISTING_YEAR"] ?? "", 10) || undefined;
  const mileageKm = parseInt(record["@LISTING_ODOMETER"] ?? "", 10) || undefined;

  return {
    externalId,
    url: `${origin}/our-vehicles/make-${slugify(make)}/model-${slugify(model)}/used-vehicle/${externalId}`,
    make,
    model,
    year,
    variant: record["@LISTING_VARIANT"] || undefined,
    engine: record["@LISTING_ENGINE"] || undefined,
    transmission: normalizeTransmission(record["@LISTING_TRANSMISSION"]),
    bodyType: normalizeBodyType(record["@LISTING_BODY_TYPE"]),
    powertrain: normalizePowertrain(record["@LISTING_FUEL_TYPE"]),
    mileageKm,
    price,
    vin: record["@LISTING_VIN"] || undefined,
    imageUrl: firstImageUrl(record),
  };
}

export async function crawlArmstrongsDealer(
  baseUrl: string,
  _existingExternalIds: Set<string>,
): Promise<NormalizedListing[]> {
  const origin = new URL(baseUrl).origin;
  const records = (await fetchJson(`${origin}/content/json/vehicles.json`)) as ArmstrongsRecord[];

  const results: NormalizedListing[] = [];
  for (const record of records) {
    const listing = parseRecord(record, origin);
    if (listing) results.push(listing);
  }
  return results;
}
