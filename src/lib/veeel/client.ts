import * as cheerio from "cheerio";

// Client for the VEEEL webservice (fuelsaver.govt.nz) — Waka Kotahi/EECA's
// official vehicle emissions, energy economy and safety rating data. See
// tech-spec-VEEEL_v2_11f.pdf for the full interface spec.
//
// Every request MUST carry a real vehicle identifier (VIN preferred, else
// plate/chassis) — VEEEL's terms of use forbid empty or fabricated lookups.
// This client is only ever called with an identifier sourced from an actual
// crawled listing, to seed vehicleSpecs (see src/db/seedVehicleSpecs.ts) —
// not called live per page view.
//
// The documented JSON endpoint (resources.fuelsaver.govt.nz/api/) redirects
// to the docs page for every input tried (confirmed live, not a guess) —
// possibly requires a differently-registered site/referer. The SOAP endpoint
// works fine over a plain HTTP GET with the same query params (the spec
// explicitly permits "POST rather than SOAP", and a GET with the op in the
// path works the same way), returning an XML .Net DataSet — used here
// instead, parsed with cheerio in XML mode rather than pulling in a
// dedicated XML parsing dependency.
const VEEEL_ENDPOINT = "https://resources.fuelsaver.govt.nz/api/vfel.asmx/V3";

export type VeeelLookupInput = {
  vin?: string;
  plate?: string;
  chassisnumber?: string;
  listingid?: string;
};

// Field names as actually returned by the service (confirmed against a real
// VIN) — the doc's Appendix 4 (separate PDF) wasn't available, so this list
// only covers what we've seen and use, not the full output set.
export type VeeelResult = {
  errorCode: number;
  make?: string;
  model?: string;
  subModel?: string;
  vehicleType?: string;
  fuelType?: string;
  engineSizeCc?: number;
  transmission?: string;
  mvrYear?: number; // year of manufacture — for matching into a yearFrom/yearTo band
  co2GramsKm?: number;
  co2StarsX2?: number; // 2x the actual star rating (half-star handling, per spec)
  fuelEconomyText?: string; // e.g. "7.1L per 100km"
  fuelStarsX2?: number;
  safetyStarsX2?: number;
  driverSafetyTest?: string; // e.g. "Based on 2025 UCSR rating for 12-17 models"
  warning?: string;
  warningSeverity?: string;
};

function text($: cheerio.CheerioAPI, tag: string): string | undefined {
  const value = $(tag).first().text().trim();
  return value.length > 0 ? value : undefined;
}

function num($: cheerio.CheerioAPI, tag: string): number | undefined {
  const value = text($, tag);
  return value !== undefined ? Number(value) : undefined;
}

export async function lookupVeeel(input: VeeelLookupInput): Promise<VeeelResult> {
  const login = process.env.VEEEL_LOGIN;
  if (!login) throw new Error("VEEEL_LOGIN is not set");
  if (!input.vin && !input.plate && !input.chassisnumber) {
    throw new Error("lookupVeeel requires at least one real vehicle identifier (vin/plate/chassisnumber)");
  }

  const params = new URLSearchParams({
    login,
    plate: input.plate ?? "",
    plate2: "",
    vin: input.vin ?? "",
    modelcode: "",
    modelvariant: "",
    chassisnumber: input.chassisnumber ?? "",
    listingid: input.listingid ?? "",
    CCDpriceEligible: "",
  });

  const res = await fetch(`${VEEEL_ENDPOINT}?${params.toString()}`);
  if (!res.ok) throw new Error(`VEEEL request failed: HTTP ${res.status}`);

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const errorCode = num($, "ErrorCode") ?? -1;

  const co2StarsX2 = num($, "CO2stars");
  const fuelStarsX2 = num($, "FuelStars");
  const safetyStarsX2 = num($, "SafetyStars");

  return {
    errorCode,
    make: text($, "Make"),
    model: text($, "Model"),
    subModel: text($, "SubModel"),
    vehicleType: text($, "VehicleType"),
    fuelType: text($, "FuelType"),
    engineSizeCc: num($, "EngineSize"),
    transmission: text($, "Transmission"),
    mvrYear: num($, "mvrYear"),
    co2GramsKm: num($, "CO2"),
    co2StarsX2,
    fuelEconomyText: text($, "FuelEconomyText"),
    fuelStarsX2,
    safetyStarsX2,
    driverSafetyTest: text($, "DriverSafetyTest"),
    warning: text($, "warning"),
    warningSeverity: text($, "warningSeverity"),
  };
}
