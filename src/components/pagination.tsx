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
        <Link href={hrefForPage(page - 1)} className="btn btn-ghost">
          ← Previous
        </Link>
      ) : (
        <span className="btn btn-ghost cursor-not-allowed opacity-45">← Previous</span>
      )}

      <span className="text-muted">
        Page <span className="font-semibold text-foreground">{page}</span> of {pageCount}
      </span>

      {page < pageCount ? (
        <Link href={hrefForPage(page + 1)} className="btn btn-ghost">
          Next →
        </Link>
      ) : (
        <span className="btn btn-ghost cursor-not-allowed opacity-45">Next →</span>
      )}
    </nav>
  );
}
