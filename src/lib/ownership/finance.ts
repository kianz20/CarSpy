import { DEFAULT_DEPOSIT_FRACTION, DEFAULT_FINANCE_APR, DEFAULT_LOAN_TERM_MONTHS } from "./constants";

export type FinanceOptions = {
  /** Deposit as an absolute dollar amount — e.g. "I have $8,000 saved."
   * Takes precedence over depositFraction when both are given, since a
   * user's actual cash-on-hand is a more direct input than a percentage of
   * whatever car they're looking at. Can legitimately exceed the vehicle
   * price (financing zero, buying outright) — loan amount is clamped at $0,
   * not treated as an error. */
  deposit?: number;
  depositFraction?: number;
  apr?: number;
  termMonths?: number;
};

/**
 * Standard reducing-balance loan amortization. Returns the total interest
 * paid within `horizonMonths` of the loan's life — not the whole loan's
 * interest — since the ownership-cost horizon (3 years = 36 months) is
 * usually shorter than a typical 5-year car loan term. Interest, not
 * principal, is the true "cost" of financing; principal repayment is money
 * that buys the car either way, ownership cost is what financing adds on top.
 */
export function estimateFinanceCost(
  price: number,
  horizonMonths: number,
  options: FinanceOptions = {},
): { monthlyPayment: number; interestPaid: number; loanAmount: number } {
  const apr = options.apr ?? DEFAULT_FINANCE_APR;
  const termMonths = options.termMonths ?? DEFAULT_LOAN_TERM_MONTHS;

  // Absolute deposit wins when specified; otherwise fall back to a fraction
  // of price (defaulting to DEFAULT_DEPOSIT_FRACTION when neither is given).
  const depositAmount = options.deposit ?? price * (options.depositFraction ?? DEFAULT_DEPOSIT_FRACTION);
  // Clamped at $0 — a deposit that matches or exceeds the price means buying
  // outright, not a negative loan.
  const loanAmount = Math.max(price - depositAmount, 0);
  if (loanAmount <= 0 || apr <= 0) {
    return { monthlyPayment: 0, interestPaid: 0, loanAmount };
  }

  const monthlyRate = apr / 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);

  // Walk the amortization schedule to find interest paid within the horizon
  // (capped at the loan's own term, in case the loan is paid off before the
  // ownership horizon ends).
  const monthsToSimulate = Math.min(horizonMonths, termMonths);
  let balance = loanAmount;
  let interestPaid = 0;
  for (let month = 0; month < monthsToSimulate; month++) {
    const interestThisMonth = balance * monthlyRate;
    const principalThisMonth = monthlyPayment - interestThisMonth;
    interestPaid += interestThisMonth;
    balance -= principalThisMonth;
  }

  return { monthlyPayment, interestPaid, loanAmount };
}
