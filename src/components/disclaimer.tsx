/**
 * Required on every results view — PLAN.md §1: "every result... carries a
 * visible disclaimer that fair-value and ownership-cost figures are
 * estimates, not professional valuations or financial advice." This is the
 * agreed mitigation for model inaccuracy in place of formal backtesting.
 */
export function Disclaimer() {
  return (
    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      Estimates only, not professional valuations or financial advice. Mileage-bracket prices reflect only the
      listings currently matching your search, not a market-wide valuation. Ownership costs use published NZ
      reference rates (fuel, RUC, insurance, finance) and bracket assumptions by body type/powertrain/age — actual
      costs will vary.
    </p>
  );
}
