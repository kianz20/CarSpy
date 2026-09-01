import { CRAWLER_USER_AGENT } from "../robots";
import type { NormalizedListing } from "../types";
import {
  normalizeBodyType,
  normalizePowertrain,
  normalizeTransmission,
  parseMileageKm,
  parsePrice,
  parseVehicleTitle,
} from "../normalize";
import { mapWithConcurrency } from "../concurrency";

/**
 * Bespoke scraper for 2 Cheap Cars (2cheapcars.co.nz) — large enough to
 * justify dedicated engineering per PLAN.md §3c. Confirmed against real
 * data, not guessed.
 *
 * Unlike the other bespoke/platform adapters, this one doesn't crawl a
 * listing/search page at all. Their robots.txt disallows the interactive
 * search UI (`/home/search`, `/s/`, and vehicle-parameter query strings)
 * but explicitly maintains a dedicated `/sitemap-inventory.xml` — a direct
 * signal from the site owner that these detail pages are meant to be
 * crawled, just not via the search form. So this adapter reads that sitemap
 * for the full list of current listing URLs, then fetches each detail page.
 *
 * Each detail page embeds a `const carSchema = {...}` object with
 * everything needed (VIN, brand, model, year, body type, transmission, fuel
 * type, odometer, price) — but it's a JS object literal with single-quoted
 * strings, not valid JSON (it only becomes JSON-LD at runtime, via
 * client-side JS that `JSON.stringify`s it into a `<script>` tag we'd never
 * see with a plain HTTP fetch). Rather than `eval`/`Function()` it — running
 * arbitrary code lifted from a third-party page's source, even a currently-
 * trusted one, is a real supply-chain risk not worth taking — each field is
 * pulled out with its own targeted regex instead.
 *
 * Cost note: because every field comes from the detail page and there's no
 * separate lightweight listing/index page available (the search UI being
 * off-limits), every one of the ~640 listings needs its own request on
 * every crawl, unlike the other adapters' "detail page only for new
 * listings" pattern. The sitemap's `<lastmod>` per URL could support
 * skipping unchanged listings on future crawls, but that requires tracking
 * a last-fetched timestamp per listing that nothing currently records —
 * left as a known future optimization rather than built now.
 */

// Every listing needs its own detail-page fetch on every crawl (see the cost
// note above), and every one of those requests is independent — no
// pagination, no shared session — so this is the adapter with the most to
// gain from concurrency instead of a sequential loop.
const DETAIL_FETCH_CONCURRENCY = 15;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
  if (!res.ok) throw new Error(`Fetch failed for ${url}: HTTP ${res.status}`);
  return res.text();
}

function parseSitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function extractField(source: string, pattern: RegExp): string | undefined {
  return source.match(pattern)?.[1];
}

function parseCarSchemaDetail(html: string, url: string): NormalizedListing | undefined {
  const schemaMatch = html.match(/const carSchema = (\{[\s\S]*?\n\s*\};)/);
  if (!schemaMatch) return undefined;
  const schema = schemaMatch[1];

  const idMatch = url.match(/\/car\/(\d+)\//);
  const externalId = idMatch?.[1];
  if (!externalId) return undefined;

  const name = extractField(schema, /"name":\s*'([^']*)'/);
  const make = extractField(schema, /"brand":\s*\{\s*"@type":\s*"Brand",\s*"name":\s*'([^']*)'/);
  const model = extractField(schema, /"model":\s*'([^']*)'/);
  const yearRaw = extractField(schema, /"vehicleModelDate":\s*'([^']*)'/);
  const priceRaw = extractField(schema, /"offers":\s*\{[\s\S]*?"price":\s*'([^']*)'/);
  if (!make || !model || priceRaw === undefined) return undefined;

  const price = parsePrice(priceRaw);
  // Same "no real asking price" case as Turners' auction listings (see
  // turners.ts) — this platform's "Enquire"/POA listings encode it as a
  // literal price of 0 rather than omitting the field, so a straight
  // `=== undefined` check doesn't catch it. There's no asking price to
  // compare fair value/ownership cost against either way, so it's excluded
  // here rather than surfaced as a $0 listing.
  if (price === undefined || price <= 0) return undefined;

  // Prefer the schema's own make/model over re-deriving them from the title
  // string, but reuse parseVehicleTitle for the variant only — it's the
  // "everything else" left after year/make/model, the same job it does for
  // the other adapters' titles.
  const { variant } = name ? parseVehicleTitle(name) : { variant: undefined };

  // Unlike every other string field here, "image" is double-quoted (not
  // single-quoted) in the raw source — confirmed against a real detail page.
  const imageUrl = extractField(schema, /"image":\s*"([^"]*)"/);
  const vin = extractField(schema, /"vehicleIdentificationNumber":\s*'([^']*)'/);
  const mileageRaw = extractField(schema, /"mileageFromOdometer":\s*\{[\s\S]*?"value":\s*'([^']*)'/);
  const bodyTypeRaw = extractField(schema, /"bodyType":\s*'([^']*)'/);
  const transmissionRaw = extractField(schema, /"vehicleTransmission":\s*'([^']*)'/);
  const fuelTypeRaw = extractField(schema, /"vehicleEngine":\s*\{[\s\S]*?"fuelType":\s*'([^']*)'/);

  return {
    externalId,
    url,
    make,
    model,
    year: yearRaw ? parseInt(yearRaw, 10) : undefined,
    variant,
    transmission: normalizeTransmission(transmissionRaw),
    bodyType: normalizeBodyType(bodyTypeRaw),
    powertrain: normalizePowertrain(fuelTypeRaw),
    mileageKm: mileageRaw ? parseMileageKm(mileageRaw) : undefined,
    price,
    vin: vin || undefined,
    imageUrl,
  };
}

// Second param kept for signature compatibility with the other adapters
// (run.ts's shared `Adapter` type) — see the cost note above for why it's
// unused here: every listing needs a fresh detail-page fetch regardless.
export async function crawlTwoCheapCarsDealer(
  baseUrl: string,
  _existingExternalIds: Set<string>,
): Promise<NormalizedListing[]> {
  const origin = new URL(baseUrl).origin;
  const sitemapXml = await fetchText(`${origin}/sitemap-inventory.xml`);
  const urls = parseSitemapUrls(sitemapXml);

  const listings = await mapWithConcurrency(urls, DETAIL_FETCH_CONCURRENCY, async (url) => {
    try {
      const html = await fetchText(url);
      return parseCarSchemaDetail(html, url);
    } catch {
      return undefined; // don't let one bad detail page fail the whole crawl
    }
  });

  return listings.filter((listing): listing is NormalizedListing => listing !== undefined);
}
