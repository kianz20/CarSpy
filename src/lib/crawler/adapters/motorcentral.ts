import * as cheerio from "cheerio";
import { CRAWLER_USER_AGENT } from "../robots";
import type { NormalizedListing } from "../types";
import { classifySpecLine, normalizeBodyType, parsePrice, parseVehicleTitle } from "../normalize";
import { mapWithConcurrency } from "../concurrency";

/**
 * Adapter for dealer sites built on the Motorcentral platform — see
 * PLAN.md §3c. Confirmed against a real site (AJ Motors) rather than
 * guessed: it's server-rendered ASP.NET WebForms HTML with static,
 * human-authored CSS classes (unlike Facebook's compiler-generated atomic
 * classes), so plain HTTP + cheerio is enough — no headless browser needed
 * for this platform.
 *
 * Cost/politeness tradeoff (see PLAN.md §5a): the listing page alone gives
 * us price, mileage, transmission, and powertrain — everything except body
 * type. Body type only appears on the detail page. Rather than fetching a
 * detail page for every one of a dealer's ~1000+ listings on every crawl,
 * we only fetch the detail page for listings we haven't seen before —
 * body type doesn't change for a given car, so it only needs capturing once.
 */

// No per-request delay between pages — no dealer's robots.txt specifies a
// Crawl-delay, and bounded concurrency (not an artificial sleep) is what
// throttles the detail-page fetches below. See PLAN.md Phase 3 addendum.
const REQUEST_DELAY_MS = 0;
const MAX_PAGES_SAFETY_CAP = 300;
// Detail-page fetches for newly-sighted listings are independent of each
// other, so they run in parallel batches instead of one at a time — see
// concurrency.ts for why this is a request-concurrency cap, not threading.
const DETAIL_FETCH_CONCURRENCY = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
  if (!res.ok) throw new Error(`Fetch failed for ${url}: HTTP ${res.status}`);
  return res.text();
}

type ListingPageCard = {
  externalId: string;
  url: string;
  rawTitle: string;
  price: number;
  mileageKm?: number;
  transmission?: string;
  powertrain?: string;
  engine?: string;
  imageUrl?: string;
};

function parseListingPage(html: string, origin: string): ListingPageCard[] {
  const $ = cheerio.load(html);
  const cards: ListingPageCard[] = [];

  // Card wrapper tag/classes vary by Motorcentral template tier — AJ Motors
  // uses `<li class="vehicle featured">`, Team Hutchinson All Makes uses
  // `<div class="cell vehicle small-12 ...">` (caught via a smoke test that
  // returned 0 results for the latter despite a 200 response). A bare class
  // selector matches the exact "vehicle" token regardless of tag or what
  // else shares the element, without accidentally matching class names that
  // merely start with "vehicle-" (CSS class matching is token-based).
  $(".vehicle").each((_, el) => {
    const anchor = $(el).find('a[href^="/vehicle/"]').first();
    const href = anchor.attr("href");
    if (!href) return;

    const [pathPart] = href.split("?");
    const externalId = pathPart.split("/").filter(Boolean).pop();
    if (!externalId) return;

    const rawTitle = $(el).find("h6").first().text().replace(/\s+/g, " ").trim();
    if (!rawTitle) return;

    const amountEl = $(el).find(".price .amount").first().clone();
    amountEl.find(".on-road-costs").remove();
    const price = parsePrice(amountEl.text());
    if (price === undefined) return;

    const specsText = $(el).find(".vehicle-specs").first().text().replace(/\s+/g, " ").trim();
    // Different Motorcentral template tiers format this line differently —
    // AJ Motors uses commas ("80,678km, Automatic, Hybrid, 1200cc"), Team
    // Hutchinson All Makes uses spaces with no commas at all ("120,466km
    // Automatic Petrol 1986cc") — caught via a smoke test that returned 0
    // listings for the latter despite the card selector itself working.
    // classifySpecLine handles both by classifying each token by pattern
    // instead of assuming a fixed position.
    const { mileageKm, transmission, powertrain, engine } = classifySpecLine(specsText);

    // The card's photo sits alongside a promo badge image (class varies —
    // "on-sale", "new", etc., so denylisting classes is fragile) inside the
    // same wrapper. The actual car photo is the only <img> here with an
    // `alt` attribute, which is what actually distinguishes it.
    const imageSrc = $(el).find(".cell-photo img[alt]").first().attr("src");
    const imageUrl = imageSrc ? new URL(imageSrc, origin).toString() : undefined;

    cards.push({
      externalId,
      url: `${origin}${pathPart}`,
      rawTitle,
      price,
      mileageKm,
      transmission,
      powertrain,
      engine,
      imageUrl,
    });
  });

  return cards;
}

type DetailPageData = {
  bodyType?: string;
  imageUrl?: string;
};

// Exported for the one-off body-type backfill script (see
// scripts/backfillBodyType.ts) — re-fetches this same detail-page field for
// already-known listings whose body type came back unrecognized on first
// sighting (e.g. the "Motorbike" case fixed in normalize.ts), since the
// regular crawl only fetches the detail page once, on first sighting.
export async function fetchDetailBodyType(url: string): Promise<string | undefined> {
  const data = await fetchDetailPageData(url);
  return data.bodyType;
}

export async function fetchDetailPageData(url: string): Promise<DetailPageData> {
  const html = await fetchHtml(url);

  // Template tiers differ in what they embed, not just how they look: Team
  // Hutchinson All Makes' detail page carries a schema.org JSON-LD block
  // with a clean "bodyType" field, but AJ Motors' has no JSON-LD at all —
  // confirmed by checking both directly, not assumed from one working.
  // Try the more robust JSON-LD source first, fall back to the label/value
  // table scraping that's needed for templates without it.
  let bodyType: string | undefined;
  const jsonLdMatch = html.match(/"bodyType":\s*"([^"]*)"/);
  if (jsonLdMatch) bodyType = normalizeBodyType(jsonLdMatch[1]);

  if (!bodyType) {
    const $ = cheerio.load(html);
    let bodyRaw: string | undefined;
    $(".title.ellipsis").each((_, el) => {
      if ($(el).text().trim() === "Body") {
        bodyRaw = $(el).next().text().replace(/\s+/g, " ").trim();
      }
    });
    bodyType = normalizeBodyType(bodyRaw);
  }

  // Extract image from og:image meta tag — listing cards load images
  // dynamically via JS, so the static listing page has no img src. The
  // detail page's og:image always has it.
  let imageUrl: string | undefined;
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogImageMatch) imageUrl = ogImageMatch[1];

  return { bodyType, imageUrl };
}

/**
 * Crawls one Motorcentral-powered dealer's full listing inventory.
 * `existingExternalIds` lets the caller skip the extra detail-page fetch for
 * listings already known (see cost/politeness note above).
 *
 * Pagination itself stays sequential (page count isn't known upfront — the
 * loop has to fetch a page to find out if there's a next one), but the
 * detail-page fetches for newly-sighted listings don't depend on each other
 * at all, so they're batched afterward with bounded concurrency
 * (concurrency.ts) instead of one-at-a-time with a sleep between each.
 */
export async function crawlMotorcentralDealer(
  baseUrl: string,
  existingExternalIds: Set<string>,
  maxPages: number = MAX_PAGES_SAFETY_CAP,
): Promise<NormalizedListing[]> {
  const origin = new URL(baseUrl).origin;
  const cards: ListingPageCard[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = page === 1 ? `${origin}/vehicles` : `${origin}/vehicles?Page=${page}`;
    const html = await fetchHtml(pageUrl);
    const pageCards = parseListingPage(html, origin);
    if (pageCards.length === 0) break;

    for (const card of pageCards) {
      if (seenIds.has(card.externalId)) continue; // pagination overlap guard
      seenIds.add(card.externalId);
      cards.push(card);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  const detailDataByExternalId = new Map<string, DetailPageData>();
  const newCards = cards.filter((card) => !existingExternalIds.has(card.externalId));
  await mapWithConcurrency(newCards, DETAIL_FETCH_CONCURRENCY, async (card) => {
    try {
      detailDataByExternalId.set(card.externalId, await fetchDetailPageData(card.url));
    } catch {
      detailDataByExternalId.set(card.externalId, {}); // don't let one bad detail page fail the whole crawl
    }
  });

  return cards.map((card) => {
    const { year, make, model, variant } = parseVehicleTitle(card.rawTitle);
    const detailData = detailDataByExternalId.get(card.externalId) || {};
    return {
      externalId: card.externalId,
      url: card.url,
      make,
      model,
      year,
      variant,
      engine: card.engine,
      transmission: card.transmission,
      bodyType: detailData.bodyType,
      powertrain: card.powertrain,
      mileageKm: card.mileageKm,
      price: card.price,
      // Prefer the detail page's image (extracted from og:image) over the
      // listing card's static-HTML image (which may not exist if loaded via JS)
      imageUrl: detailData.imageUrl || card.imageUrl,
    };
  });
}
