import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { searchSubscriptions, users } from "../db/schema";
import { getNewMatchesForSubscription, type ListingSearchFilters } from "../lib/search/listings";
import { describeFilters, filtersToSearchParams } from "../lib/search/subscriptionFilters";
import { mapWithConcurrency } from "../lib/crawler/concurrency";
import { sendEmail } from "../lib/email/send";
import { searchAlertHtml } from "../lib/email/templates";

const CONCURRENCY = 10;

/** True if it's currently Monday in NZ — checked via Intl rather than server
 * UTC date math, so the DST offset the crawl/alert cron comments already
 * accept doesn't also have to be reasoned about here. */
function isMondayInNZ(): boolean {
  const weekday = new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", weekday: "short" }).format(new Date());
  return weekday === "Mon";
}

async function processSubscription(row: {
  id: number;
  filters: unknown;
  unsubscribeToken: string;
  lastNotifiedAt: Date | null;
  createdAt: Date;
  email: string;
}): Promise<void> {
  const filters = row.filters as ListingSearchFilters;
  const since = row.lastNotifiedAt ?? row.createdAt;
  const { matches, hasMore } = await getNewMatchesForSubscription(filters, since);

  if (matches.length === 0) {
    // Nothing to email, but still advance the cursor — otherwise a quiet
    // search keeps re-scanning an ever-growing window from the same old date.
    await db.update(searchSubscriptions).set({ lastNotifiedAt: new Date() }).where(eq(searchSubscriptions.id, row.id));
    return;
  }

  const searchParams = filtersToSearchParams(filters);
  const viewAllLink = `${process.env.APP_URL}/?${searchParams.toString()}`;
  const unsubscribeLink = `${process.env.APP_URL}/alerts/unsubscribe?token=${row.unsubscribeToken}`;

  try {
    await sendEmail({
      to: row.email,
      subject: `New matches for ${describeFilters(filters)}`,
      html: searchAlertHtml(
        matches,
        hasMore,
        describeFilters(filters),
        viewAllLink,
        (id) => `${process.env.APP_URL}/listing/${id}`,
        unsubscribeLink,
      ),
    });
  } catch (err) {
    // Don't advance lastNotifiedAt on a failed send — retried next run
    // against the same unadvanced window, same pattern as the register/
    // forgot-password email failures not silently losing state.
    console.error(`[error] alert send failed for subscription ${row.id} —`, err);
    return;
  }

  await db.update(searchSubscriptions).set({ lastNotifiedAt: new Date() }).where(eq(searchSubscriptions.id, row.id));
}

async function run() {
  const weekly = isMondayInNZ();

  const rows = await db
    .select({
      id: searchSubscriptions.id,
      filters: searchSubscriptions.filters,
      frequency: searchSubscriptions.frequency,
      unsubscribeToken: searchSubscriptions.unsubscribeToken,
      lastNotifiedAt: searchSubscriptions.lastNotifiedAt,
      createdAt: searchSubscriptions.createdAt,
      email: users.email,
    })
    .from(searchSubscriptions)
    .innerJoin(users, eq(searchSubscriptions.userId, users.id));

  const due = rows.filter((r) => r.frequency === "daily" || (r.frequency === "weekly" && weekly));
  console.log(`[alerts] ${due.length} of ${rows.length} subscriptions due (weekly digest day: ${weekly})`);

  await mapWithConcurrency(due, CONCURRENCY, processSubscription);

  console.log("[alerts] done");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
