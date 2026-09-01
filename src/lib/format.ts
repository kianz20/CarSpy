const currencyFormatter = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const numberFormatter = new Intl.NumberFormat("en-NZ");

export function formatNumber(n: number): string {
  return numberFormatter.format(n);
}

/**
 * Engine capacity comes from crawled listings as free text — mostly "1240cc"
 * or "1200 cc", but sometimes with trailing motor power ("1991cc/155kW"),
 * junk prefixes from bad source parsing ("000mi Automatic Petrol 4691cc"),
 * or no displacement at all for some EV listings ("180kW"). Extracting just
 * the cc digits handles the messy cases and lets us show a litres figure,
 * which is what buyers actually recognize ("1.2L") — falls back to the raw
 * text unchanged when no "cc" figure is present at all.
 */
export function formatEngine(engine: string): string {
  const match = engine.match(/(\d+)\s*cc/i);
  if (!match) return engine;
  const cc = Number(match[1]);
  const litres = (cc / 1000).toFixed(1);
  return `${litres}L (${cc}cc)`;
}
