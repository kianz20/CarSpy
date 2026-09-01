import * as cheerio from "cheerio";
import { CRAWLER_USER_AGENT } from "../robots";
import type { NormalizedListing } from "../types";
import { normalizeBodyType, normalizePowertrain, normalizeTransmission, parseMileageKm, parsePrice } from "../normalize";
import { mapWithConcurrency } from "../concurrency";

/**
 * Bespoke scraper for Turners (turners.co.nz) — NZ's largest used-car chain,
 * large enough to justify dedicated engineering per PLAN.md §3c rather than
 * being covered by a shared-platform adapter. Confirmed against real data,
 * not guessed.
 *
 * Richest data source found so far: each card carries full schema.org `Car`
 * microdata (make, model, year, body type, fuel type, odometer, and a clean
 * numeric `content` attribute on the price element that sidesteps any
 * "Now $X Was $Y" discount-text parsing entirely) — so no detail-page fetch
 * is ever needed. Only transmission and engine size lack an itemprop and are
 * read off a plain label/value table row instead.
 *
 * Pagination turned out to be genuinely tricky and worth documenting: the
 * page's own `?pagesize=&pageno=` query-string parameters do NOT drive real
 * pagination — the pagination links render as `href="#"`, which was the
 * giveaway. The static GET always returns the same first page of results
 * regardless of what's in the query string (confirmed by fetching several
 * pagesize/pageno combinations and finding page 1 and page 2 byte-identical).
 * Real pagination happens client-side via `POST /Client/car/SearchList`
 * (found by capturing network traffic with Playwright while clicking a page
 * link), which needs the ASP.NET Core anti-forgery double-submit cookie —
 * an initial GET sets an `XSRF-TOKEN` cookie, and the POST must echo that
 * same value back as an `X-XSRF-TOKEN` header alongside the cookie itself.
 * The endpoint's response has a `resultsContent` field containing the same
 * card markup as the static page, so the existing microdata parser works
 * unchanged — it's only the transport that differs. `pagesize: 120` was
 * confirmed to work correctly through this API (unlike the dead query-string
 * version), cutting the ~2,800-listing crawl to ~24 requests.
 *
 * About 22% of raw cards get skipped further down (auction listings with no
 * disclosed price) — see the comment at that check for why that's correct.
 */

const MAX_PAGES_SAFETY_CAP = 100;
const PAGE_SIZE = 120;
const PAGE_FETCH_CONCURRENCY = 8;

async function getSession(origin: string): Promise<{ cookieHeader: string; xsrfToken: string }> {
  const res = await fetch(`${origin}/Cars/Used-Cars-for-Sale/`, {
    headers: { "User-Agent": CRAWLER_USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed to establish session for ${origin}: HTTP ${res.status}`);

  const setCookies = res.headers.getSetCookie();
  const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  const xsrfToken = setCookies.find((c) => c.startsWith("XSRF-TOKEN="))?.split(";")[0].split("=")[1];
  if (!xsrfToken) throw new Error(`No XSRF-TOKEN cookie returned by ${origin} — site behavior may have changed`);

  return { cookieHeader, xsrfToken };
}

type SearchListResponse = {
  totalResults: number;
  startIndex: number;
  endIndex: number;
  resultsContent: string;
};

async function fetchSearchPage(
  origin: string,
  session: { cookieHeader: string; xsrfToken: string },
  pageno: number,
): Promise<SearchListResponse> {
  const res = await fetch(`${origin}/Client/car/SearchList`, {
    method: "POST",
    headers: {
      "User-Agent": CRAWLER_USER_AGENT,
      "Content-Type": "application/json; charset=UTF-8",
      "X-XSRF-TOKEN": session.xsrfToken,
      "X-Requested-With": "XMLHttpRequest",
      Cookie: session.cookieHeader,
    },
    body: JSON.stringify({
      pageno,
      filters: { sortorder: "7", pagesize: String(PAGE_SIZE), pageno },
    }),
  });
  if (!res.ok) throw new Error(`SearchList request failed for page ${pageno}: HTTP ${res.status}`);
  return res.json();
}

function parseResultsFragment(html: string, origin: string): NormalizedListing[] {
  const $ = cheerio.load(html);
  const results: NormalizedListing[] = [];

  $('.product-block[itemtype="http://schema.org/Car"]').each((_, el) => {
    const card = $(el);
    const externalId = card.attr("data-goodnumber");
    const href = card.find('a[itemprop="url"]').first().attr("href");
    if (!externalId || !href) return;

    const year = parseInt(card.find('[itemprop="productionDate"]').first().text().trim(), 10) || undefined;
    const make = card.find('[itemtype="http://schema.org/Brand"] [itemprop="name"]').first().attr("content");
    const model = card.find('[itemprop="model"]').first().attr("content");
    if (!make || !model) return;

    const headerText = card.find(".search-header").first().text().replace(/\s+/g, " ").trim();
    const variant =
      headerText
        .replace(year ? String(year) : "", "")
        .replace(new RegExp(make, "i"), "")
        .replace(new RegExp(model, "i"), "")
        .trim() || undefined;

    const priceContent = card.find('[itemprop="price"]').first().attr("content");
    const price = priceContent ? parsePrice(priceContent) : undefined;
    // Turners sells via live/online auction as well as fixed "Buy Now" price
    // — auction listings without a disclosed starting bid have no price at
    // all in the markup. Skipping them here is intentional, not a parsing
    // gap: confirmed by surveying the full live inventory that this accounts
    // for exactly the ~22% of listings that don't carry a price (607/2783 in
    // that survey, all `block-type-live-auction`/`block-type-online-auction`
    // cards) — there's no asking price to compare against fair value for
    // these, so they can't feed the valuation model regardless.
    if (price === undefined) return;

    const bodyType = normalizeBodyType(card.find('[itemprop="bodyType"]').first().text());
    const powertrain = normalizePowertrain(card.find('[itemprop="fuelType"]').first().text());

    // Transmission and engine size have no itemprop — read them off their
    // label/value table row instead, same pattern as the detail-page
    // parsing in the other three adapters.
    const fields: Record<string, string> = {};
    card.find(".info-details-list tr").each((__, row) => {
      const label = $(row).find("td").first().text().trim().toLowerCase();
      const value = $(row).find("td").eq(1).text().trim();
      if (label) fields[label] = value;
    });

    results.push({
      externalId,
      url: `${origin}${href}`,
      make,
      model,
      year,
      variant,
      engine: fields["engine"],
      transmission: normalizeTransmission(fields["transmission"]),
      bodyType,
      powertrain,
      mileageKm: fields["odometer"] ? parseMileageKm(fields["odometer"]) : undefined,
      price,
    });
  });

  return results;
}

// Second param kept for signature compatibility with the other adapters
// (run.ts's shared `Adapter` type) even though it's unused — this adapter
// gets everything it needs from the listing page, so there's no detail-page
// fetch to skip for already-known listings.
export async function crawlTurnersDealer(
  baseUrl: string,
  _existingExternalIds: Set<string>,
): Promise<NormalizedListing[]> {
  const origin = new URL(baseUrl).origin;
  const session = await getSession(origin);

  // Page 1 has to go first — it's the only way to learn `totalResults`, and
  // therefore how many more pages there are. Once known, though, every
  // remaining page is an independent request (the API is paged by offset,
  // not cursor-linked), so they're fetched concurrently instead of one
  // after another — pagination here doesn't have to be sequential the way
  // Motorcentral/CarUpdater's "fetch a page to find out if there's a next
  // one" pagination does.
  const firstPage = await fetchSearchPage(origin, session, 1);
  const totalPages = Math.min(Math.ceil(firstPage.totalResults / PAGE_SIZE), MAX_PAGES_SAFETY_CAP);
  const remainingPageNumbers = Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => i + 2);

  const remainingPages = await mapWithConcurrency(remainingPageNumbers, PAGE_FETCH_CONCURRENCY, (pageno) =>
    fetchSearchPage(origin, session, pageno),
  );

  const results: NormalizedListing[] = [];
  const seenIds = new Set<string>();
  for (const response of [firstPage, ...remainingPages]) {
    for (const item of parseResultsFragment(response.resultsContent, origin)) {
      if (seenIds.has(item.externalId)) continue; // overlap guard — pages fetched concurrently could in principle race with a live reorder
      seenIds.add(item.externalId);
      results.push(item);
    }
  }

  return results;
}
