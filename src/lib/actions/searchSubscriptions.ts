"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteSubscription, updateSubscriptionFrequency, upsertSubscription, type SubscriptionFrequency } from "@/lib/search/subscriptions";
import type { ListingSearchFilters } from "@/lib/search/listings";

export type SubscribeResult = { ok: true } | { ok: false; error: "not_authenticated" };

export async function subscribeToSearchAction(
  filters: ListingSearchFilters,
  frequency: SubscriptionFrequency,
): Promise<SubscribeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  await upsertSubscription(user.id, filters, frequency);
  revalidatePath("/settings");
  return { ok: true };
}

export async function unsubscribeFromSearchAction(subscriptionId: number): Promise<SubscribeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  await deleteSubscription(subscriptionId, user.id);
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateSubscriptionFrequencyAction(
  subscriptionId: number,
  frequency: SubscriptionFrequency,
): Promise<SubscribeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  await updateSubscriptionFrequency(subscriptionId, user.id, frequency);
  revalidatePath("/settings");
  return { ok: true };
}
