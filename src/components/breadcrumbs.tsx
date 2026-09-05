import Link from "next/link";

export type Crumb = { label: string; href?: string };

const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

/** Visible breadcrumb trail + matching BreadcrumbList JSON-LD, so the same
 * hierarchy is legible to both users and Google. The last crumb is always
 * the current page — pass it without an `href` (it renders as plain text,
 * not a self-link). Reused by the listing detail page and, from phase 2 on,
 * the /cars and /locations landing pages, so every page's parent chain is
 * built from the same component instead of hand-rolled per route. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    // `item` must be an absolute URL for Google's structured-data parsers —
    // unlike the <Link>s below, which stay relative for Next's client-side
    // routing.
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-accent hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
