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
};
