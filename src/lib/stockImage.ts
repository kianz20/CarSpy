// imagin.studio's CDN takes make/model/year as query params and returns a
// stock photo (or its own "no match" placeholder if it doesn't recognize the
// model) — no scraping, no account signup needed to try it, no server-side
// fetch on our end since the browser loads it directly. Not the actual
// listing's own photos (the dealer sites don't expose those to us yet), just
// a representative shot of the make/model/year.
//
// IMAGIN_STUDIO_CUSTOMER_KEY defaults to imagin.studio's public demo key,
// which is rate-limited and meant for evaluation only — sign up for a free
// key at imagin.studio and set the env var for real use.
const DEFAULT_CUSTOMER_KEY = "hrjavascript-mastery";

export function getStockImageUrl(make: string, model: string, year?: number): string {
  const customer = process.env.IMAGIN_STUDIO_CUSTOMER_KEY || DEFAULT_CUSTOMER_KEY;
  const params = new URLSearchParams({
    customer,
    make,
    modelFamily: model,
    zoomType: "fullscreen",
  });
  if (year !== undefined) params.set("modelYear", String(year));
  return `https://cdn.imagin.studio/getImage?${params.toString()}`;
}
