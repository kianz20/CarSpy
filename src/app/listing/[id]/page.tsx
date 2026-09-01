import { notFound } from "next/navigation";
import Link from "next/link";
import { getListingById } from "@/lib/search/listings";
import { estimate3YearOwnershipCost, type InsuranceCoverType } from "@/lib/ownership";
import { OwnershipBreakdown } from "@/components/ownership-breakdown";
import { Disclaimer } from "@/components/disclaimer";
import { ListingImage } from "@/components/listing-image";
import { getStockImageUrl } from "@/lib/stockImage";
import { formatCurrency, formatEngine, formatNumber } from "@/lib/format";

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const row = await getListingById(listingId);
  if (!row) notFound();

  const { listings: listing, dealers: dealer } = row;
  const price = parseFloat(listing.price);

  // Carries the same deposit/financeEnabled/annualKm the user set on the
  // search page so the breakdown here matches what they saw on the results
  // list, rather than silently reverting to defaults.
  const query = await searchParams;
  const deposit = toNumber(first(query.deposit));
  const annualKm = toNumber(first(query.annualKm));
  const queryInsuranceCoverType = first(query.insuranceCoverType);
  const insuranceCoverType: InsuranceCoverType | undefined =
    queryInsuranceCoverType === "third_party_fire_theft" || queryInsuranceCoverType === "none" ? queryInsuranceCoverType : undefined;
  // See search-form.tsx's hidden-fallback comment — absence here (an old
  // link predating this field, say) defaults to finance on, matching prior
  // behavior; explicit "false" is the only way to turn it off.
  const financeEnabled = first(query.financeEnabled) !== "false";

  // Finance off means no loan is modeled at all — depositFraction: 1 forces
  // loanAmount (and so financeInterest) to $0, consistent with how the
  // search results list computes the same listing's cost.
  const financeOptions = financeEnabled ? { deposit } : { depositFraction: 1 };

  const ownershipCost = estimate3YearOwnershipCost(
    {
      make: listing.make,
      year: listing.year ?? undefined,
      bodyType: listing.bodyType ?? undefined,
      powertrain: listing.powertrain ?? undefined,
      price,
      mileageKm: listing.mileageKm ?? undefined,
    },
    { ...financeOptions, annualKm, insuranceCoverType },
  );

  // Only round-trips deposit/financeEnabled/annualKm/insuranceCoverType (the
  // only params this page receives) — the browser's own back button is what
  // actually restores the full set of search filters, since this is a plain
  // link, not a reconstruction of them.
  const backParams = new URLSearchParams();
  if (deposit !== undefined) backParams.set("deposit", String(deposit));
  if (!financeEnabled) backParams.set("financeEnabled", "false");
  if (annualKm !== undefined) backParams.set("annualKm", String(annualKm));
  if (insuranceCoverType) backParams.set("insuranceCoverType", insuranceCoverType);
  const backHref = `/${backParams.size > 0 ? `?${backParams.toString()}` : ""}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href={backHref} className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
        ← Back to search
      </Link>

      <header>
        <h1 className="text-2xl font-bold">
          {listing.year} {listing.make} {listing.model}
        </h1>
        {listing.variant && <p className="text-sm text-zinc-500 dark:text-zinc-400">{listing.variant}</p>}
      </header>

      <ListingImage
        src={listing.imageUrl ?? undefined}
        fallbackSrc={getStockImageUrl(listing.make, listing.model, listing.year ?? undefined)}
        alt={`${listing.year ?? ""} ${listing.make} ${listing.model}`.trim()}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <div>
          <div className="text-3xl font-bold">{formatCurrency(price)}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">asking price</div>
        </div>
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          View on {dealer.name} →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15 sm:grid-cols-3">
        <Detail label="Mileage" value={listing.mileageKm !== null ? (listing.mileageKm === 0 ? "New" : `${formatNumber(listing.mileageKm)} km`) : undefined} />
        <Detail label="Transmission" value={listing.transmission ?? undefined} capitalize />
        <Detail label="Fuel type" value={listing.powertrain ?? undefined} capitalize />
        <Detail label="Vehicle type" value={listing.bodyType?.replace("_", " ")} capitalize />
        <Detail label="Engine" value={listing.engine ? formatEngine(listing.engine) : undefined} />
        <Detail label="Import status" value={listing.importStatus === "nz_new" ? "NZ new" : listing.importStatus === "import" ? "Import" : undefined} />
        <Detail label="VIN" value={listing.vin ?? undefined} />
        <Detail label="Dealer" value={dealer.name} />
        <Detail label="Region" value={dealer.region ?? undefined} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">How the {ownershipCost.ownershipYears}-year ownership cost is calculated</h2>
        <OwnershipBreakdown
          breakdown={ownershipCost}
          price={price}
          bodyType={listing.bodyType}
          powertrain={listing.powertrain}
          make={listing.make}
          year={listing.year}
          mileageKm={listing.mileageKm}
          deposit={financeEnabled ? deposit : undefined}
          financeEnabled={financeEnabled}
          annualKm={annualKm}
        />
      </section>

      <Disclaimer />
    </div>
  );
}

function Detail({ label, value, capitalize }: { label: string; value?: string; capitalize?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className={capitalize ? "capitalize" : undefined}>{value}</div>
    </div>
  );
}
