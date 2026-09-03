import { db } from "@/db/client";
import { searchLog } from "@/db/schema";
import { isAdminEmail } from "@/lib/auth/admin";
import type { SessionUser } from "@/lib/auth/session";
import type { ListingSearchFilters, ListingSort } from "@/lib/search/listings";

/** Records a real search for the future "popular searches" query (see
 * popular-search-chips.tsx). Skipped entirely for admins — their own
 * testing/QA browsing shouldn't count toward what's "popular" — but logged
 * for every other search, signed in or not. Best-effort: a logging failure
 * should never break the search itself. */
export async function logSearch(
  filters: ListingSearchFilters,
  sort: ListingSort,
  resultCount: number,
  currentUser: SessionUser | undefined,
): Promise<void> {
  if (currentUser && isAdminEmail(currentUser.email)) return;

  try {
    await db.insert(searchLog).values({
      userId: currentUser?.id,
      filters,
      sort,
      resultCount,
    });
  } catch {
    // Analytics is never allowed to fail the page.
  }
}
