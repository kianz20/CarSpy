/**
 * Minimal server-side timing log for diagnosing "why is this request slow"
 * without guessing from browser network-tab totals (which conflate DB cold
 * starts, query time, and JS costing work into one number). On by default
 * outside production; set PERF_LOGGING=1 to force it on anywhere, or 0 to
 * force it off.
 */
const ENABLED = process.env.PERF_LOGGING === "1" || (process.env.NODE_ENV !== "production" && process.env.PERF_LOGGING !== "0");

let requestSeq = 0;

/** Groups a set of timed() calls under one request id, so concurrent
 * requests' logs don't interleave into a confusing single timeline. */
export function newRequestId(label: string): string {
  requestSeq += 1;
  const id = `${label}#${requestSeq}`;
  if (ENABLED) console.log(`[timing] ${id} start`);
  return id;
}

export async function timed<T>(requestId: string, label: string, fn: () => Promise<T>): Promise<T> {
  if (!ENABLED) return fn();
  const start = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`[timing] ${requestId} ${label}: ${(performance.now() - start).toFixed(1)}ms`);
  }
}
