/**
 * Bounded concurrency for network-bound work. This isn't a threading
 * problem — Node's I/O is already non-blocking, and page-parsing (cheerio)
 * is cheap enough not to matter at this scale — so the actual lever is how
 * many requests are in flight at once, not how many OS threads run them.
 * A hard concurrency cap keeps that bounded per host instead of firing
 * everything at once, which is both the practical limit (some sites/CDNs
 * throttle or reset a burst of simultaneous connections) and a deliberate
 * choice not to fully abandon politeness even with the per-request delay
 * removed.
 */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) return;
      results[current] = await fn(items[current], current);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
