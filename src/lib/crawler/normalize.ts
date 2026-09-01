/**
 * Shared normalization helpers for turning a dealer site's free-text fields
 * into our canonical values (src/lib/taxonomy/data.ts). Kept adapter-agnostic
 * since every platform describes body type / powertrain / transmission in
 * its own wording, but they all need to land on the same canonical set.
 */

// Multi-word makes that a naive "first token = year, second token = make"
// title split would break on (see PLAN.md §3b — this was the exact failure
// mode noted in the reference Facebook scraper's title parsing).
const MULTI_WORD_MAKES = [
  "Land Rover",
  "Alfa Romeo",
  "Aston Martin",
  "Great Wall",
  "Mercedes Benz",
  "Mercedes-Benz",
];

// Different dealer platforms put the year in different places in a listing
// title — Motorcentral leads with it ("2021 Nissan Kicks E-POWER X"),
// CarUpdater trails with it ("Chevrolet Silverado 1500 Ltz 2021") — so this
// checks both ends rather than assuming one convention.
export function parseVehicleTitle(rawTitle: string): {
  year?: number;
  make: string;
  model: string;
  variant?: string;
} {
  const tokens = rawTitle.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

  let year: number | undefined;
  let start = 0;
  let end = tokens.length;
  if (/^\d{4}$/.test(tokens[0])) {
    year = parseInt(tokens[0], 10);
    start = 1;
  } else if (/^\d{4}$/.test(tokens[tokens.length - 1])) {
    year = parseInt(tokens[tokens.length - 1], 10);
    end = tokens.length - 1;
  }

  const working = tokens.slice(start, end);
  const twoTokenCandidate = working.slice(0, 2).join(" ");
  const multiWordMatch = MULTI_WORD_MAKES.find((m) => m.toLowerCase() === twoTokenCandidate.toLowerCase());

  const make = multiWordMatch ?? working[0] ?? "Unknown";
  const makeTokenCount = multiWordMatch ? 2 : 1;
  const model = working[makeTokenCount] ?? "Unknown";
  const variant = working.slice(makeTokenCount + 1).join(" ") || undefined;

  return { year, make, model, variant };
}

export function parsePrice(rawPrice: string): number | undefined {
  // Some dealer platforms embed markup in what's otherwise a "price" field
  // for discounted listings, e.g. CarUpdater's data-price attribute:
  // "<span>Now $31,990</span> <span>Was $33,990</span>" — naively stripping
  // all non-digits from that concatenates both amounts into garbage (caught
  // via a smoke test against real Blackwells data). Prefer the first
  // dollar-amount match, which is always the current price, not the
  // original one; fall back to stripping non-digits for plain "$21,980"-
  // style strings with nothing else in them.
  const dollarMatch = rawPrice.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  const digits = (dollarMatch ? dollarMatch[1] : rawPrice).replace(/[^\d.]/g, "");
  if (!digits) return undefined;
  return parseFloat(digits);
}

export function parseMileageKm(rawMileage: string): number | undefined {
  const digits = rawMileage.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return parseInt(digits, 10);
}

export function normalizeTransmission(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  // "auto" is checked before "manual" so "automated manual" (dual-clutch/DSG-style
  // gearboxes) lands on "automatic" — driven like one, not a true manual.
  if (lower.includes("auto")) return "automatic";
  if (lower.includes("manual")) return "manual";
  if (lower.includes("cvt")) return "automatic"; // CVT is itself a type of automatic transmission
  // A survey of real AdTorque Edge data (see PLAN.md §3c) found some listings
  // describe the field as "hybrid drivetrain" instead of naming a transmission
  // at all. Every hybrid sold new in NZ uses an automatic/CVT — manual-transmission
  // hybrids are not something the NZ used market has — so this is a safe inference,
  // not a guess from nothing.
  if (lower.includes("hybrid")) return "automatic";
  // A survey of real Armstrong's data (see PLAN.md §3c) found more raw values
  // that describe a CVT or an EV's single-speed drive unit without using the
  // word "auto" or "cvt" at all — these accounted for 275 of 277 initially
  // "missing" transmissions in that dataset, not a genuine data gap:
  if (lower.includes("continuous variable")) return "automatic"; // CVT, spelled out in full
  if (lower.includes("intelligent variable")) return "automatic"; // e.g. Nissan's branded CVT name
  if (lower.includes("final drive") || lower.includes("eaxle")) return "automatic"; // EV single-speed drive unit — no gears to shift
  return undefined;
}

/** Matches against src/lib/taxonomy/data.ts powertrain values. */
export function normalizePowertrain(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("hybrid") && (lower.includes("plug") || lower.includes("phev"))) return "phev";
  if (lower.includes("hybrid")) return "hybrid";
  if (lower.includes("electric") || lower === "ev") return "ev";
  if (lower.includes("diesel")) return "diesel";
  if (lower.includes("petrol") || lower.includes("gas")) return "petrol";
  return undefined;
}

/** Matches against src/lib/taxonomy/data.ts body-type values. */
export function normalizeBodyType(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("suv") || lower.includes("rv/")) return "suv";
  if (lower.includes("ute") || lower.includes("utility") || lower.includes("pickup")) return "ute";
  if (lower.includes("hatch")) return "hatch";
  if (lower.includes("sedan") || lower.includes("saloon")) return "sedan";
  if (lower.includes("wagon") || lower.includes("estate")) return "wagon";
  if (lower.includes("people mover") || lower.includes("van/minivan") || lower.includes("mpv")) return "people_mover";
  if (lower.includes("van")) return "van";
  if (lower.includes("convertible") || lower.includes("cabrio")) return "convertible";
  if (lower.includes("coupe")) return "coupe";
  return undefined;
}

/**
 * Classifies a free-text vehicle specs line (e.g. "80,678km, Automatic,
 * Hybrid, 1200cc" or, on a different dealer's template, "120,466km Automatic
 * Petrol 1986cc" with no commas at all) into fields by pattern rather than
 * position. Two real bugs already came from assuming a fixed field
 * count/order/delimiter: Motorcentral's thousands-separator comma shifting
 * every field after mileage by one, and 2 Cheap Cars sometimes omitting fuel
 * type or appending a drivetrain descriptor instead. This is the shared fix
 * for both, extracted after the same mistake nearly happened a second time
 * on a Motorcentral dealer whose template uses spaces instead of commas.
 */
export function classifySpecLine(specText: string): {
  mileageKm?: number;
  transmission?: string;
  powertrain?: string;
  engine?: string;
  bodyType?: string;
} {
  const withoutMileage = specText.replace(/&nbsp;/g, " ");
  const mileageMatch = withoutMileage.match(/([\d,]+)\s*km/i);
  const mileageKm = mileageMatch ? parseMileageKm(mileageMatch[1]) : undefined;
  const remainder = withoutMileage.replace(mileageMatch?.[0] ?? "", "");

  // Split on commas if the line uses them; otherwise fall back to whitespace,
  // since some templates separate fields with neither punctuation nor a
  // consistent count.
  const segments = (remainder.includes(",") ? remainder.split(",") : remainder.split(/\s+/))
    .map((s) => s.trim())
    .filter(Boolean);

  const result: ReturnType<typeof classifySpecLine> = { mileageKm };
  for (const seg of segments) {
    if (result.engine === undefined && /cc$/i.test(seg)) {
      result.engine = seg;
      continue;
    }
    if (result.transmission === undefined) {
      const t = normalizeTransmission(seg);
      if (t) {
        result.transmission = t;
        continue;
      }
    }
    if (result.powertrain === undefined) {
      const p = normalizePowertrain(seg);
      if (p) {
        result.powertrain = p;
        continue;
      }
    }
    if (/wheel/i.test(seg)) continue; // drivetrain descriptor (2WD/4WD/Front Wheel/etc.) — not modelled in our schema
    if (result.bodyType === undefined) {
      const b = normalizeBodyType(seg);
      if (b) result.bodyType = b;
    }
  }
  return result;
}
