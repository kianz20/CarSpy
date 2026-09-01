export type NormalizedListing = {
  externalId: string;
  url: string;
  make: string;
  model: string;
  year?: number;
  variant?: string;
  engine?: string;
  transmission?: string;
  bodyType?: string;
  powertrain?: string;
  mileageKm?: number;
  price: number;
  /** Populated when a dealer platform exposes it (e.g. AdTorque Edge) — see PLAN.md §5a dedup notes. */
  vin?: string;
  /** The listing's own primary photo URL, hotlinked from the dealer site — not
   * downloaded/mirrored. Falls back to a stock make/model photo on the
   * frontend (see src/lib/stockImage.ts) when a platform doesn't expose one. */
  imageUrl?: string;
};
