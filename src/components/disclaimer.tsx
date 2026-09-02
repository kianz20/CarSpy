/**
 * Required on every results view — PLAN.md §1: "every result... carries a
 * visible disclaimer that fair-value and ownership-cost figures are
 * estimates, not professional valuations or financial advice." This is the
 * agreed mitigation for model inaccuracy in place of formal backtesting.
 */
export function Disclaimer() {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-amber-400 bg-amber-100 px-3.5 py-2.5 text-xs font-medium text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-200">
      <span aria-hidden="true">⚠️</span>
      <span>
        Estimates only, not professional valuations or financial advice. Mileage-bracket prices reflect only the
        listings currently matching your search, not a market-wide valuation. Ownership costs use published NZ
        reference rates (fuel, RUC, insurance, finance) and bracket assumptions by body type/powertrain/age — actual
        costs will vary.
      </span>
    </p>
  );
}
