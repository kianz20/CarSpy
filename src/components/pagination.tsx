import Link from "next/link";

/**
 * Plain server-rendered Prev/Next + page indicator — no client state needed,
 * since paging is just another query param like every filter here. Preserves
 * every other current param (filters, sort, deposit, etc.) via `current`;
 * only the URL's `page` value changes between links.
 */
export function Pagination({
  current,
  page,
  pageCount,
}: {
  current: Record<string, string>;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  function hrefForPage(targetPage: number): string {
    const params = new URLSearchParams(current);
    if (targetPage <= 1) params.delete("page");
    else params.set("page", String(targetPage));
    const query = params.toString();
    return `/${query ? `?${query}` : ""}`;
  }

  return (
    <nav className="flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          ← Previous
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded-md border border-black/10 px-3 py-1.5 text-zinc-400 dark:border-white/10 dark:text-zinc-600">
          ← Previous
        </span>
      )}

      <span className="text-zinc-500 dark:text-zinc-400">
        Page {page} of {pageCount}
      </span>

      {page < pageCount ? (
        <Link href={hrefForPage(page + 1)} className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          Next →
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded-md border border-black/10 px-3 py-1.5 text-zinc-400 dark:border-white/10 dark:text-zinc-600">
          Next →
        </span>
      )}
    </nav>
  );
}
