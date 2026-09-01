/**
 * Reference NZ rates used by the ownership-cost model (PLAN.md Phase 4).
 *
 * Decided against building live scrapers for these (unlike the dealer-listing
 * crawlers): fuel/electricity/finance/insurance rates change slowly (weekly
 * to yearly) relative to a friends-and-family-scale project's update cadence,
 * so a small set of documented, periodically-refreshed constants is a much
 * better cost/effort tradeoff than 4-5 separate scraper+schema+job pipelines
 * for numbers that don't move often. Each figure below is sourced and dated —
 * refresh by re-checking the cited source, not by guessing.
 */

/** NZ$ per litre, national average. Volatile in 2026 due to Middle East
 * conflict-driven oil-market disruption — re-check MBIE's weekly fuel price
 * monitoring (mbie.govt.nz) before trusting this for more than a few months.
 * Sourced 2026-08-31. */
export const PETROL_PRICE_PER_LITRE = 3.16;
export const DIESEL_PRICE_PER_LITRE = 2.69;

/** NZ road user charges — light vehicles (<3,500kg), per 1,000km, GST incl.
 * Diesel and EVs pay the full rate; PHEVs pay a reduced rate since they also
 * pay fuel excise on the petrol they burn (avoids double-charging). Petrol
 * vehicles pay $0 RUC — road funding is already built into the pump price
 * via fuel excise duty. Sourced 2026-08-31 (NZTA/Waka Kotahi rates, EV RUC
 * took effect 1 July 2026). */
export const RUC_PER_1000KM = {
  diesel: 76.0,
  ev: 76.0,
  phev: 38.0,
  petrol: 0,
  hybrid: 0,
} as const;

/** NZ$ per kWh, national residential average. Sourced 2026-08-31 (MBIE/Powerswitch). */
export const ELECTRICITY_PRICE_PER_KWH = 0.4;

/** NZ$ per hour, independent workshop national average, GST incl. Sourced
 * 2026-08-31 — varies significantly by region/brand (see servicing.ts). */
export const WORKSHOP_LABOUR_RATE_PER_HOUR = 110;

/** NZ$ per year, average comprehensive policy (Quashed Q2 2026 index).
 * Used as the baseline for insurance.ts's bracket adjustment, not a quote. */
export const AVERAGE_ANNUAL_COMPREHENSIVE_PREMIUM = 1311;

/** NZ$ per year, average Third Party, Fire & Theft policy. NZ buyers of
 * sub-$5k cars overwhelmingly choose TPFT over comprehensive (insuring a
 * cheap car for more than a chunk of its own value in comprehensive premiums
 * doesn't make sense) — this is the alternate baseline insurance.ts uses when
 * that cover type is selected. No single published market-average index for
 * TPFT the way Quashed publishes one for comprehensive, so this is derived as
 * ~55% of the comprehensive average — the ratio observed between comprehensive
 * and TPFT quotes across NZ comparison guides (e.g. quashed.co.nz's cover-type
 * comparison) — applied to AVERAGE_ANNUAL_COMPREHENSIVE_PREMIUM above. Sourced
 * 2026-09-01; re-derive the ratio if that comprehensive average is refreshed. */
export const AVERAGE_ANNUAL_TPFT_PREMIUM = Math.round(AVERAGE_ANNUAL_COMPREHENSIVE_PREMIUM * 0.55);

/** Representative used-car finance APR. Real rates range ~9.9%-19.9% at
 * finance companies and ~8.5%-15.5% at banks depending on credit profile —
 * this is a single representative midpoint for the model, not a quote; a
 * user's actual rate will vary. Sourced 2026-08-31. */
export const DEFAULT_FINANCE_APR = 0.135;

/** NZ light-vehicle average annual distance travelled (Waka Kotahi fleet
 * statistics, long-running ballpark figure). Used as the default driving
 * assumption when a listing/user doesn't specify one. */
export const DEFAULT_ANNUAL_KM = 12000;

/** Default finance assumptions when the user doesn't specify their own. */
export const DEFAULT_DEPOSIT_FRACTION = 0.2;
export const DEFAULT_LOAN_TERM_MONTHS = 60;

export const OWNERSHIP_PERIOD_YEARS = 3;

/** NZ annual vehicle license ("rego") fee, 12-month private light-passenger
 * rate, effective 1 July 2026 (NZTA fee schedule, confirmed via
 * calculate.co.nz's published rates 2026-09-01). This DOES vary by fuel
 * type, in the opposite direction you'd expect: petrol vehicles' ACC
 * motor-vehicle-account levy is collected through fuel excise duty at the
 * pump, so it's not charged again here. Diesel and EV owners don't buy
 * excise-taxed fuel, so that levy is instead folded into their annual
 * license fee — EVs lost their discount when it ended 1 July 2025, so they
 * now pay the same higher rate as diesel. Hybrids/PHEVs still buy taxed
 * petrol, so they're priced with petrol (not explicitly listed in the
 * source table — inferred from how the levy is collected). */
export const ANNUAL_VEHICLE_LICENSE_FEE_BY_POWERTRAIN = {
  petrol: 181.45,
  hybrid: 181.45,
  phev: 181.45,
  diesel: 248.83,
  ev: 248.83,
} as const;

/** NZ WOF inspection cost, per check, independent testing-station average
 * (typically quoted as a $50-$80 range) — sourced 2026-09-01. */
export const WOF_INSPECTION_COST = 65;

/** WOFs are due annually for every vehicle. Until November 2026, pre-2000
 * vehicles were actually due every 6 months — but NZTA is scrapping that
 * six-monthly rule from November 2026 (confirmed, not proposed), and this
 * model estimates cost forward from today over a 3-year horizon, so the
 * annual rule is what will actually apply for nearly the whole ownership
 * period being estimated. Revisit if that repeal slips. Sourced 2026-09-01. */
export const WOF_INSPECTIONS_PER_YEAR = 1;
