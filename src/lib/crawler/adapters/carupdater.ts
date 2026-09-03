import * as cheerio from "cheerio";
import { CRAWLER_USER_AGENT } from "../robots";
import type { NormalizedListing } from "../types";
import { inferMotorcycleFromEngineCc, normalizeBodyType, normalizePowertrain, normalizeTransmission, parsePrice, parseVehicleTitle } from "../normalize";
import { mapWithConcurrency } from "../concurrency";

/**
 * Adapter for dealer sites built on the CarUpdater platform — see
 * PLAN.md §3c. Confirmed against a real site (Blackwells), not guessed.
 * Unlike Motorcentral (plain server-rendered HTML), the listing page here
 * is a client-side shell that lazy-loads results via a POST JSON endpoint
 * (`/PUApi/vehicle/getlist`, found by capturing network traffic with
 * Playwright) that returns an HTML fragment per page inside a JSON envelope.
 * Once that endpoint was identified, no headless browser is needed here
 * either — a plain POST + cheerio-on-the-fragment is enough and much
 * cheaper than rendering the page.
 *
 * Same cost/politeness tradeoff as Motorcentral (see motorcentral.ts):
 * the listing fragment gives mileage/engine/transmission/price; body type
 * and fuel type only exist on the detail page, so that's only fetched once
 * per listing, on first sighting.
 */

// No per-request delay between pages — see motorcentral.ts's identical note.
const REQUEST_DELAY_MS = 0;
const MAX_PAGES_SAFETY_CAP = 300;
const DETAIL_FETCH_CONCURRENCY = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type GetListResponse = {
  Success: boolean;
  Html: string;
};

async function fetchListPage(origin: string, page: number): Promise<string> {
  const res = await fetch(`${origin}/PUApi/vehicle/getlist`, {
    method: "POST",
    headers: {
      "User-Agent": CRAWLER_USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      type: "",
      make: "",
      model: "",
      fromPrice: "",
      toPrice: "",
      fromYear: "",
      toYear: "",
      fromMileage: "",
      toMileage: "",
      fromEngine: "",
      toEngine: "",
      listingType: "used",
      keyword: "",
      sort: "1",
      v: "",
      page: String(page),
    }),
  });
  if (!res.ok) throw new Error(`Fetch failed for ${origin} page ${page}: HTTP ${res.status}`);
  const json = (await res.json()) as GetListResponse;
  return json.Html ?? "";
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
  if (!res.ok) throw new Error(`Fetch failed for ${url}: HTTP ${res.status}`);
  return res.text();
}

type ListingCard = {
  externalId: string;
  url: string;
  rawTitle: string;
  price: number;
  mileageKm?: number;
  engine?: string;
  transmission?: string;
  imageUrl?: string;
};

function parseListFragment(html: string): ListingCard[] {
  const $ = cheerio.load(html);
  const cards: ListingCard[] = [];

  $(".car-wrapper").each((_, el) => {
    const detailLink = $(el).find('a[href*="/vehicle/"]').first();
    const url = detailLink.attr("href");
    const externalId = $(el).find("[data-id]").first().attr("data-id");
    const rawTitle = $(el).find("h1").first().text().replace(/\s+/g, " ").trim();
    const priceRaw = $(el).find("[data-price]").first().attr("data-price") ?? $(el).find(".price").first().text();
    const price = parsePrice(priceRaw);

    if (!url || !externalId || !rawTitle || price === undefined) return;

    // Prefer the "large" variant carried in data-image (used for the quick
    // view/gallery) over the thumbnail <img> src, which is a smaller "medium" crop.
    const imageUrl = $(el).find("[data-image]").first().attr("data-image") ?? $(el).find(".thumb img").first().attr("src");

    let mileageKm: number | undefined;
    let engine: string | undefined;
    let transmission: string | undefined;
    $(el)
      .find(".other-spec")
      .first()
      .children()
      .each((__, spec) => {
        const text = $(spec).text().trim();
        if (/km/i.test(text)) mileageKm = parseInt(text.replace(/[^\d]/g, ""), 10) || undefined;
        else if (/cc$/i.test(text)) engine = text;
        else transmission = normalizeTransmission(text) ?? transmission;
      });

    cards.push({ externalId, url, rawTitle, price, mileageKm, engine, transmission, imageUrl });
  });

  return cards;
}

async function fetchDetailFields(url: string): Promise<{ bodyType?: string; powertrain?: string }> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const fields: Record<string, string> = {};

  $(".specifications .row").each((_, row) => {
    const heading = $(row).find(".heading").first().text().replace(":", "").trim().toLowerCase();
    const value = $(row).find(".text").first().text().replace(/\s+/g, " ").trim();
    if (heading) fields[heading] = value;
  });

  return {
    bodyType: normalizeBodyType(fields["body"]),
    powertrain: normalizePowertrain(fields["fuel type"]),
  };
}

export async function crawlCarUpdaterDealer(
  baseUrl: string,
  existingExternalIds: Set<string>,
  maxPages: number = MAX_PAGES_SAFETY_CAP,
): Promise<NormalizedListing[]> {
  const origin = new URL(baseUrl).origin;
  const cards: ListingCard[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const html = await fetchListPage(origin, page);
    const pageCards = parseListFragment(html);
    if (pageCards.length === 0) break;

    for (const card of pageCards) {
      if (seenIds.has(card.externalId)) continue; // pagination overlap guard
      seenIds.add(card.externalId);
      cards.push(card);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  // Detail-page fetches for newly-sighted listings don't depend on each
  // other, so they run in parallel batches (concurrency.ts) instead of
  // one-at-a-time.
  const detailFieldsByExternalId = new Map<string, { bodyType?: string; powertrain?: string }>();
  const newCards = cards.filter((card) => !existingExternalIds.has(card.externalId));
  await mapWithConcurrency(newCards, DETAIL_FETCH_CONCURRENCY, async (card) => {
    try {
      detailFieldsByExternalId.set(card.externalId, await fetchDetailFields(card.url));
    } catch {
      // don't let one bad detail page fail the whole crawl
    }
  });

  return cards.map((card) => {
    const { year, make, model, variant } = parseVehicleTitle(card.rawTitle);
    const detailFields = detailFieldsByExternalId.get(card.externalId);
    return {
      externalId: card.externalId,
      url: card.url,
      make,
      model,
      year,
      variant,
      engine: card.engine,
      transmission: card.transmission,
      bodyType: detailFields?.bodyType ?? inferMotorcycleFromEngineCc(card.engine),
      powertrain: detailFields?.powertrain,
      mileageKm: card.mileageKm,
      price: card.price,
      imageUrl: card.imageUrl,
    };
  });
}
