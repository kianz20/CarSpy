import { Resend } from "resend";

// Lazily constructed, not at module load — this file is imported from the
// crawler script too (see priceDropAlerts.ts), and RESEND_API_KEY may not be
// set in every environment that imports this module transitively (e.g.
// local dev without email configured). Throwing only when actually sending
// keeps everything else working without it.
let client: Resend | undefined;
function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set — cannot send email");
  client ??= new Resend(apiKey);
  return client;
}

export async function sendPriceDropEmail(params: {
  to: string;
  make: string;
  model: string;
  year: number | null;
  oldPrice: number;
  newPrice: number;
  listingUrl: string;
}): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not set — cannot send email");

  const vehicleName = `${params.year ?? ""} ${params.make} ${params.model}`.trim();
  const drop = params.oldPrice - params.newPrice;
  const formatMoney = (n: number) => `$${n.toLocaleString("en-NZ", { maximumFractionDigits: 0 })}`;

  await getClient().emails.send({
    from,
    to: params.to,
    subject: `Price drop: ${vehicleName} is now ${formatMoney(params.newPrice)}`,
    html: `
      <p>A car on your watchlist just dropped in price.</p>
      <p><strong>${vehicleName}</strong><br />
      ${formatMoney(params.oldPrice)} → <strong>${formatMoney(params.newPrice)}</strong> (down ${formatMoney(drop)})</p>
      <p><a href="${params.listingUrl}">View this listing</a></p>
      <p style="color:#888;font-size:12px;">You're getting this because you enabled price-drop email alerts on your CarValue watchlist. Turn it off from the watchlist page any time.</p>
    `,
  });
}
