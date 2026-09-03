/**
 * Automatic Next.js loading UI for "/" — covers navigating back to the
 * search page (the "Back to search" and "See other listings" links on the
 * detail page, and any other link into "/") the same way listing/[id]'s
 * loading.tsx covers navigating into a listing: shown the instant
 * navigation starts, swapped for the real page once its Server Component
 * (the search query, category options, etc.) resolves.
 */
export default function HomeLoading() {
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
      <span className="sr-only">Loading…</span>
    </div>
  );
}
