"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { addToWatchlist, removeFromWatchlist, isListingWatchlisted } from "@/lib/watchlist";

export type ToggleWatchlistResult = { ok: true; isWatchlisted: boolean } | { ok: false; error: "not_authenticated" };

export async function toggleWatchlistAction(listingId: number): Promise<ToggleWatchlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const alreadyWatchlisted = await isListingWatchlisted(user.id, listingId);
  if (alreadyWatchlisted) {
    await removeFromWatchlist(user.id, listingId);
  } else {
    await addToWatchlist(user.id, listingId);
  }

  // Only /watchlist's own list actually needs to change shape when an item
  // is removed — search results and the detail page just need their star
  // re-rendered, which the client component already does optimistically.
  revalidatePath("/watchlist");

  return { ok: true, isWatchlisted: !alreadyWatchlisted };
}
