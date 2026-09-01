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
  type OwnershipCostBreakdown,
} from "@/lib/ownership";
import { formatCurrency, formatNumber } from "@/lib/format";
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
  make,
  year,
  mileageKm,
  deposit,
  annualKm,
}: {
  breakdown: OwnershipCostBreakdown;
  price: number;
  bodyType: string | null;
  powertrain: string | null;
  make: string;
  year: number | null;
  mileageKm?: number | null;
  deposit?: number;
  annualKm?: number;
}) {
  const effectiveAnnualKm = annualKm ?? DEFAULT_ANNUAL_KM;
  const totalKm = effectiveAnnualKm * breakdown.ownershipYears;
  const consumption = estimateConsumption(
    bodyType ?? undefined,
    powertrain ?? undefined,
  );
  const rucRate =
    RUC_PER_1000KM[(powertrain as keyof typeof RUC_PER_1000KM) ?? "petrol"] ??
    0;
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
    explanation: string;
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
      label: "Fuel / electricity + road user charges",
      amount: breakdown.fuelAndRuc,
      explanation: (() => {
        const consumptionText = consumption.kwhPer100Km
          ? `${consumption.kwhPer100Km} kWh/100km at ${formatCurrency(ELECTRICITY_PRICE_PER_KWH)}/kWh`
          : `${consumption.litresPer100Km} L/100km at ${formatCurrency(powertrain === "diesel" ? DIESEL_PRICE_PER_LITRE : PETROL_PRICE_PER_LITRE)}/L`;
        const rucText =
          rucRate > 0
            ? `, plus Road User Charges at ${formatCurrency(rucRate)} per 1,000km`
            : " (no RUC — petrol/hybrid pay via fuel excise instead)";
        return `Based on ${formatNumber(effectiveAnnualKm)} km/year (${formatNumber(totalKm)} km over ${breakdown.ownershipYears} years) at an estimated ${consumptionText} for this body type/powertrain${rucText}.`;
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
            ...(annualKm !== undefined ? { annualKm: String(annualKm) } : {}),
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
          className="rounded-lg border border-black/10 p-3 dark:border-white/15"
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium">{row.label}</span>
            <span className="text-sm font-semibold">
              {formatCurrency(row.amount)}
            </span>
          </div>
          {row.headerExtra && <div className="mt-2">{row.headerExtra}</div>}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {row.explanation}
          </p>
          {row.subItems && (
            <div className="mt-2 flex flex-col gap-2 border-t border-black/5 pt-2 dark:border-white/10">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Per year
              </span>
              {row.subItems.map((sub) => (
                <div key={sub.label} className="pl-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs font-medium">{sub.label}</span>
                    <span className="text-xs font-semibold">
                      {formatCurrency(sub.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {sub.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-black/10 pt-3 dark:border-white/15">
        <span className="text-sm font-semibold">
          Total {breakdown.ownershipYears}-year ownership cost
        </span>
        <span className="text-lg font-bold">
          {formatCurrency(breakdown.total)}
        </span>
      </div>
    </div>
  );
}
