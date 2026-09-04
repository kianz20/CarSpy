"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { addToWatchlist, removeFromWatchlist, setEmailOnPriceDropAlerts } from "@/lib/watchlist";

export type ToggleWatchlistResult = { ok: true; isWatchlisted: boolean } | { ok: false; error: "not_authenticated" };

/** The client already knows whether the listing is currently watchlisted
 * (it's what drove the optimistic flip) — taking it as a param instead of
 * re-querying it here cuts a whole DB round-trip off every toggle, which is
 * exactly the round-trip a rapid unwatchlist-then-watchlist click was
 * waiting on (the button used to stay disabled for it). */
export async function toggleWatchlistAction(
  listingId: number,
  currentlyWatchlisted: boolean,
): Promise<ToggleWatchlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  if (currentlyWatchlisted) {
    await removeFromWatchlist(user.id, listingId);
  } else {
    await addToWatchlist(user.id, listingId);
  }

  // Only /watchlist's own list actually needs to change shape when an item
  // is removed — search results and the detail page just need their star
  // re-rendered, which the client component already does optimistically.
  revalidatePath("/watchlist");

  return { ok: true, isWatchlisted: !currentlyWatchlisted };
}

export type SetEmailOnPriceDropResult = { ok: true } | { ok: false; error: "not_authenticated" };

/** One global switch for the whole watchlist, not a per-item toggle — see
 * schema.ts's userSettings.emailOnPriceDropAlerts. */
export async function setEmailOnPriceDropAlertsAction(enabled: boolean): Promise<SetEmailOnPriceDropResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  await setEmailOnPriceDropAlerts(user.id, enabled);
  revalidatePath("/watchlist");

  return { ok: true };
}
