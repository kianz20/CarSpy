/**
 * Automatic Next.js loading UI for /listing/[id] — shown the instant
 * navigation starts and swapped for the real page once its Server Component
 * (getListingById + the other lookups) resolves. Without this, a click on a
 * listing card sits on the search page with no feedback for however long
 * that fetch takes, which reads as the site being unresponsive rather than
 * just loading.
 */
export default function ListingDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1700px] flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <svg
        className="h-8 w-8 animate-spin text-accent"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">Loading listing…</span>
    </div>
  );
}
