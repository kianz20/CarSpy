import {
  estimateConsumption,
  DEFAULT_ANNUAL_KM,
  DEFAULT_FINANCE_APR,
  DEFAULT_DEPOSIT_FRACTION,
  DEFAULT_LOAN_TERM_MONTHS,
  PETROL_PRICE_PER_LITRE,
  DIESEL_PRICE_PER_LITRE,
  ELECTRICITY_PRICE_PER_KWH,
  RUC_PER_1000KM,
  WORKSHOP_LABOUR_RATE_PER_HOUR,
  AVERAGE_ANNUAL_COMPREHENSIVE_PREMIUM,
  AVERAGE_ANNUAL_TPFT_PREMIUM,
  ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN,
  WOF_INSPECTION_COST,
  SERVICE_HOURS_BY_POWERTRAIN,
  DEFAULT_SERVICE_HOURS,
  SERVICE_MINOR_PARTS_COST_BY_POWERTRAIN,
  DEFAULT_SERVICE_MINOR_PARTS_COST,
  OIL_FILTER_COST_BY_POWERTRAIN,
  TYRE_SET_COST_BY_BODY_TYPE,
  DEFAULT_TYRE_SET_COST,
  TYRE_REPLACEMENT_INTERVAL_KM,
  BRAKE_JOB_COST,
  BRAKE_INTERVAL_KM_BASE,
  BRAKE_INTERVAL_MULTIPLIER_BY_POWERTRAIN,
  mileageRepairMultiplier,
  OWNERSHIP_PERIOD_YEARS,
  type OwnershipCostBreakdown,
} from "@/lib/ownership";
import { formatCurrency, formatNumber, formatUnitPrice } from "@/lib/format";
import { InsuranceCoverToggle } from "@/components/insurance-cover-toggle";

/**
 * Explains each line of the 3-year ownership estimate, not just the total —
 * the disclaimer says these are estimates built from published reference
 * rates and bracket assumptions, so a user should be able to see exactly
 * which rate/assumption produced each number rather than trusting a black box.
 */
export function OwnershipBreakdown({
  breakdown,
  price,
  bodyType,
  powertrain,
  engine,
  make,
  year,
  mileageKm,
  deposit,
  financeEnabled = false,
  annualKm,
}: {
  breakdown: OwnershipCostBreakdown;
  price: number;
  bodyType: string | null;
  powertrain: string | null;
  engine?: string | null;
  make: string;
  year: number | null;
  mileageKm?: number | null;
  /** Only meaningful (and only ever set by the caller) when financeEnabled —
   * with finance off there's no deposit to preserve, so undefined is correct
   * there too, including for the insurance toggle's own URL reconstruction. */
  deposit?: number;
  financeEnabled?: boolean;
  annualKm?: number;
}) {
  const effectiveAnnualKm = annualKm ?? DEFAULT_ANNUAL_KM;
  const totalKm = effectiveAnnualKm * breakdown.ownershipYears;
  const consumption = estimateConsumption(
    bodyType ?? undefined,
    powertrain ?? undefined,
    engine ?? undefined,
  );
  const rucRate =
    RUC_PER_1000KM[(powertrain as keyof typeof RUC_PER_1000KM) ?? "petrol"] ??
    0;
  // Only names what's actually relevant to this listing — a petrol car
  // (which pays $0 RUC, see constants.ts) has no business being labeled
  // "... + road user charges" the way a diesel/EV/PHEV genuinely is, and a
  // non-PHEV never burns both fuel and electricity.
  const fuelCostParts = [
    ...(consumption.litresPer100Km ? ["fuel"] : []),
    ...(consumption.kwhPer100Km ? ["electricity"] : []),
  ];
  const fuelCostBase = fuelCostParts.join(" + ");
  const fuelLabelLower = rucRate > 0 ? `${fuelCostBase} + road user charges` : `${fuelCostBase} costs`;
  const fuelLabel = fuelLabelLower.charAt(0).toUpperCase() + fuelLabelLower.slice(1);
  const depositAmount = deposit ?? price * DEFAULT_DEPOSIT_FRACTION;
  const depositLabel =
    deposit !== undefined
      ? `your specified deposit of ${formatCurrency(deposit)}`
      : `the default assumption of ${DEFAULT_DEPOSIT_FRACTION * 100}% down (${formatCurrency(depositAmount)})`;
  const currentYear = new Date().getFullYear();
  const ageYears = year ? Math.max(currentYear - year, 0) : undefined;

  // --- Servicing sub-items ---
  const serviceHours =
    (powertrain ? SERVICE_HOURS_BY_POWERTRAIN[powertrain] : undefined) ??
    DEFAULT_SERVICE_HOURS;
  const serviceMinorParts =
    (powertrain
      ? SERVICE_MINOR_PARTS_COST_BY_POWERTRAIN[powertrain]
      : undefined) ?? DEFAULT_SERVICE_MINOR_PARTS_COST;
  const oilFilterUnitCost =
    (powertrain ? OIL_FILTER_COST_BY_POWERTRAIN[powertrain] : undefined) ??
    OIL_FILTER_COST_BY_POWERTRAIN.petrol;
  const tyreSetCost =
    (bodyType ? TYRE_SET_COST_BY_BODY_TYPE[bodyType] : undefined) ??
    DEFAULT_TYRE_SET_COST;
  const brakeIntervalKm =
    BRAKE_INTERVAL_KM_BASE *
    (powertrain
      ? (BRAKE_INTERVAL_MULTIPLIER_BY_POWERTRAIN[powertrain] ?? 1)
      : 1);

  const servicingSubItems: {
    label: string;
    amount: number;
    explanation: string;
  }[] = [
    {
      label: "Scheduled service",
      amount: breakdown.servicingItems.perYear.scheduledService,
      explanation: `~${serviceHours}hr labour (${formatCurrency(WORKSHOP_LABOUR_RATE_PER_HOUR)}/hr) plus minor consumables (air/cabin filter, wipers, fluid top-ups, ~${formatCurrency(serviceMinorParts)}) at one visit each year.`,
    },
    breakdown.servicingItems.perYear.oilFilter > 0
      ? {
          label: "Oil & filter",
          amount: breakdown.servicingItems.perYear.oilFilter,
          explanation: `~${formatCurrency(oilFilterUnitCost)} per change, done alongside the annual service.`,
        }
      : {
          label: "Oil & filter",
          amount: 0,
          explanation: "$0 — no engine oil to change on an EV.",
        },
    {
      label: "Tyres",
      amount: breakdown.servicingItems.perYear.tyres,
      explanation: `A full set (~${formatCurrency(tyreSetCost)} fitted) lasts ~${formatNumber(TYRE_REPLACEMENT_INTERVAL_KM)}km — prorated over ${formatNumber(effectiveAnnualKm)}km/year driven.`,
    },
    {
      label: "Brakes",
      amount: breakdown.servicingItems.perYear.brakes,
      explanation: `Pads front + rear (~${formatCurrency(BRAKE_JOB_COST)}/job) roughly every ${formatNumber(brakeIntervalKm)}km${
        powertrain === "ev" || powertrain === "hybrid" || powertrain === "phev"
          ? " (longer interval — regenerative braking reduces pad wear)"
          : ""
      } — prorated over ${formatNumber(effectiveAnnualKm)}km/year driven.`,
    },
  ];

  // --- Licensing (rego + WOF) ---
  const annualRegoFee =
    (powertrain
      ? ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN[
          powertrain as keyof typeof ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN
        ]
      : undefined) ?? ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN.petrol;

  // --- Repairs mileage context ---
  const repairAgeYears = ageYears ?? 8;
  const expectedKmForAge = Math.max(repairAgeYears, 1) * DEFAULT_ANNUAL_KM;
  const mileageMultiplier = mileageRepairMultiplier(
    mileageKm ?? undefined,
    repairAgeYears,
  );
  const mileageText =
    mileageKm == null
      ? ""
      : mileageMultiplier > 1
        ? ` This listing's ${formatNumber(mileageKm)}km is well above the ~${formatNumber(expectedKmForAge)}km expected for its age, so the estimate is scaled up ${Math.round((mileageMultiplier - 1) * 100)}%.`
        : mileageMultiplier < 1
          ? ` This listing's ${formatNumber(mileageKm)}km is well below the ~${formatNumber(expectedKmForAge)}km expected for its age, so the estimate is scaled down ${Math.round((1 - mileageMultiplier) * 100)}%.`
          : ` This listing's ${formatNumber(mileageKm)}km is in line with the ~${formatNumber(expectedKmForAge)}km expected for its age, so no adjustment is applied.`;

  const rows: {
    label: string;
    amount: number;
    explanation: React.ReactNode;
    subItems?: { label: string; amount: number; explanation: string }[];
    headerExtra?: React.ReactNode;
  }[] = [
    // Omitted entirely (rather than shown as a $0 row) when the deposit
    // covers the full price — there's no loan, so there's nothing to explain.
    ...(breakdown.loanAmount === 0
      ? []
      : [
          {
            label: "Finance interest",
            amount: breakdown.financeInterest,
            explanation: `Interest on a ${formatCurrency(breakdown.loanAmount)} loan (price minus ${depositLabel}) over ${breakdown.ownershipYears} years of a ${DEFAULT_LOAN_TERM_MONTHS}-month term at ${(DEFAULT_FINANCE_APR * 100).toFixed(1)}% p.a.`,
          },
        ]),
    {
      label: fuelLabel,
      amount: breakdown.fuelAndRuc,
      explanation: (() => {
        const consumptionText = consumption.kwhPer100Km
          ? `${consumption.kwhPer100Km} kWh/100km at ${formatUnitPrice(ELECTRICITY_PRICE_PER_KWH)}/kWh`
          : `${consumption.litresPer100Km?.toFixed(1)} L/100km at ${formatUnitPrice(powertrain === "diesel" ? DIESEL_PRICE_PER_LITRE : PETROL_PRICE_PER_LITRE)}/L`;
        // Only claim the adjustment when the engine field actually parsed to
        // a displacement (see consumption.ts's parseEngineLitres) — some
        // listings' engine text has no "cc" figure at all (e.g. just power,
        // "180kW"), where no adjustment was actually applied.
        const engineMatch = !consumption.kwhPer100Km ? engine?.match(/(\d+)\s*cc/i) : undefined;
        const bullets = [
          `Based on ${formatNumber(effectiveAnnualKm)} km/year (${formatNumber(totalKm)} km over ${breakdown.ownershipYears} years)`,
          `Estimated at ${consumptionText} for this body type/powertrain`,
          ...(engineMatch ? [`Adjusted for its ${(Number(engineMatch[1]) / 1000).toFixed(1)}L engine`] : []),
          // Petrol/hybrid pay for road funding via fuel excise at the pump
          // instead — worth a bullet only when RUC actually applies here.
          ...(rucRate > 0 ? [`Plus Road User Charges at ${formatCurrency(rucRate)} per 1,000km`] : []),
        ];
        return (
          <ul className="list-disc space-y-0.5 pl-4">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        );
      })(),
    },
    {
      label: "Servicing",
      amount: breakdown.servicing,
      explanation: `Per-year breakdown below (scheduled visits, oil & filter, tyres and brakes — the last three wear by distance driven, not just calendar time) × ${breakdown.ownershipYears} years.`,
      subItems: servicingSubItems,
    },
    {
      label: "Registration & WOF",
      amount: breakdown.licensing,
      explanation: `Vehicle license (~${formatCurrency(annualRegoFee)}/year${powertrain === "diesel" || powertrain === "ev" ? " — diesel/EV pay more here since their ACC levy isn't collected via fuel excise like petrol's is" : ""}) plus an annual WOF at ~${formatCurrency(WOF_INSPECTION_COST)}, over ${breakdown.ownershipYears} years.`,
    },
    {
      label: "Insurance",
      amount: breakdown.insurance,
      explanation:
        breakdown.insuranceCoverType === "none"
          ? "Going uninsured is legal in NZ, but leaves you covering this car's own repair/replacement cost and any at-fault liability yourself."
          : breakdown.insuranceCoverType === "third_party_fire_theft"
            ? `Scaled from an average NZ Third Party, Fire & Theft premium (${formatCurrency(AVERAGE_ANNUAL_TPFT_PREMIUM * 3)} for 3 years) against this listing's ${formatCurrency(price)} price, over ${breakdown.ownershipYears} years.`
            : `Scaled from the NZ average comprehensive premium (${formatCurrency(AVERAGE_ANNUAL_COMPREHENSIVE_PREMIUM * 3)} for 3 years) against this listing's ${formatCurrency(price)} price, over ${breakdown.ownershipYears} years.`,
      headerExtra: (
        <InsuranceCoverToggle
          coverType={breakdown.insuranceCoverType}
          searchParams={{
            ...(deposit !== undefined ? { deposit: String(deposit) } : {}),
            // Financing defaults to off — only worth round-tripping when
            // it's actually on (the reverse of this component's old
            // default, back when finance defaulted to on instead).
            ...(financeEnabled ? { financeEnabled: "true" } : {}),
            ...(annualKm !== undefined ? { annualKm: String(annualKm) } : {}),
            ...(breakdown.ownershipYears !== OWNERSHIP_PERIOD_YEARS
              ? { ownershipYears: String(breakdown.ownershipYears) }
              : {}),
          }}
        />
      ),
    },
    {
      label: "Unscheduled repairs",
      amount: breakdown.repairs,
      explanation: `An estimate by vehicle age${ageYears !== undefined ? ` (${ageYears} years old)` : " (age unknown, assumed mid-age)"} and a brand-tier multiplier (budget-reliable/mainstream/premium/exotic) for ${make}, over ${breakdown.ownershipYears} years.${mileageText}`,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-lg border border-border bg-surface-2/60 p-3"
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-base font-semibold">{row.label}</span>
            <span className="text-base font-bold">
              {formatCurrency(row.amount)}
            </span>
          </div>
          {row.headerExtra && <div className="mt-2">{row.headerExtra}</div>}
          <div className="mt-1 text-sm text-muted">
            {row.explanation}
          </div>
          {row.subItems && (
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted/80">
                Per year
              </span>
              {row.subItems.map((sub) => (
                <div key={sub.label} className="pl-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium">{sub.label}</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(sub.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {sub.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold">
          {breakdown.ownershipYears === 1
            ? "Total annual maintenance cost"
            : `Total ${breakdown.ownershipYears}-year ownership cost`}
        </span>
        <span className="text-lg font-extrabold accent-gradient-text">
          {formatCurrency(breakdown.total)}
        </span>
      </div>
    </div>
  );
}
