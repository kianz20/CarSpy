import * as cheerio from "cheerio";
import { CRAWLER_USER_AGENT } from "../robots";
import type { NormalizedListing } from "../types";
import { normalizeBodyType, normalizePowertrain, normalizeTransmission, parseMileageKm, parsePrice } from "../normalize";
import { mapWithConcurrency } from "../concurrency";

/**
 * Adapter for dealer sites built on the AdTorque Edge platform ("AutoPlay")
 * — see PLAN.md §3c. Confirmed against a real site (Andrew Simms), not
 * guessed. Richest data source of the three platforms: year/make/model/
 * variant/price/odometer/fuel/body-type/VIN are all directly on the listing
 * card (no title-string parsing needed at all, unlike Motorcentral/
 * CarUpdater), and there's no pagination to loop — `/stock/list-all` returns
 * every listing for a given condition in one response.
 *
 * Only transmission is missing from the card. The detail page carries a
 * clean schema.org `Car` JSON-LD block with everything (including
 * transmission), fetched only for new listings — same cost/politeness
 * tradeoff as the other two adapters.
 *
 * NB: AdTorque Edge has a reported TradeMe data-sharing partnership (see
 * PLAN.md §3c) — check that ToS before enabling this adapter on a new
 * dealer, not just its robots.txt.
 */

const DETAIL_FETCH_CONCURRENCY = 10;

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
  if (!res.ok) throw new Error(`Fetch failed for ${url}: HTTP ${res.status}`);
  return res.text();
}

type ListingCard = {
  externalId: string;
  url: string;
  make: string;
  model: string;
  year?: number;
  variant?: string;
  price: number;
  mileageKm?: number;
  powertrain?: string;
  bodyType?: string;
  vin?: string;
};

function parseListPage(html: string, origin: string): ListingCard[] {
  const $ = cheerio.load(html);
  const cards: ListingCard[] = [];

  $(".stock-item").each((_, el) => {
    const anchor = $(el).find(".si-title").first();
    const href = anchor.attr("href");
    if (!href) return;

    const idMatch = href.match(/\/stock\/details\/(\d+)\//);
    const externalId = idMatch?.[1];
    if (!externalId) return;

    const year = parseInt(anchor.find(".year").first().text().trim(), 10) || undefined;
    const make = anchor.find(".make").first().text().trim();
    const model = anchor.find(".model").first().text().trim();
    const variant = anchor.find(".badge").first().text().trim() || undefined;
    if (!make || !model) return;

    const priceText = $(el).find(".price-value").first().text();
    const price = parsePrice(priceText);
    if (price === undefined) return;

    const features = $(el).find(".si-features").first();
    const mileageKm = parseMileageKm(features.find(".odometer").first().text());
    const powertrain = normalizePowertrain(features.find(".fuel").first().text());
    const bodyType = normalizeBodyType(features.find(".body-type").first().text());
    const vin = $(el).attr("data-vin") || undefined;

    cards.push({
      externalId,
      url: `${origin}${href}`,
      make,
      model,
      year,
      variant,
      price,
      mileageKm,
      powertrain,
      bodyType,
      vin,
    });
  });

  return cards;
}

async function fetchDetailTransmission(url: string): Promise<string | undefined> {
  const html = await fetchHtml(url);
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">(\s*\{\s*"@context":\s*"https:\/\/schema\.org"[\s\S]*?)<\/script>/);
  if (!jsonLdMatch) return undefined;
  try {
    const data = JSON.parse(jsonLdMatch[1]);
    return normalizeTransmission(data.vehicleTransmission);
  } catch {
    return undefined;
  }
}

export async function crawlAdTorqueEdgeDealer(
  baseUrl: string,
  existingExternalIds: Set<string>,
): Promise<NormalizedListing[]> {
  const origin = new URL(baseUrl).origin;
  const html = await fetchHtml(`${origin}/stock/list-all?condition=Used`);
  const cards = parseListPage(html, origin);

  // No pagination here (the whole inventory comes back in one response), so
  // the only thing worth parallelizing is the per-new-listing detail fetch
  // for transmission — independent requests, batched with bounded
  // concurrency instead of one-at-a-time (concurrency.ts).
  const transmissionByExternalId = new Map<string, string | undefined>();
  const newCards = cards.filter((card) => !existingExternalIds.has(card.externalId));
  await mapWithConcurrency(newCards, DETAIL_FETCH_CONCURRENCY, async (card) => {
    try {
      transmissionByExternalId.set(card.externalId, await fetchDetailTransmission(card.url));
    } catch {
      // don't let one bad detail page fail the whole crawl
    }
  });

  return cards.map((card) => ({
    externalId: card.externalId,
    url: card.url,
    make: card.make,
    model: card.model,
    year: card.year,
    variant: card.variant,
    transmission: transmissionByExternalId.get(card.externalId),
    bodyType: card.bodyType,
    powertrain: card.powertrain,
    mileageKm: card.mileageKm,
    price: card.price,
    vin: card.vin,
  }));
}
