import { randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { searchSubscriptions } from "@/db/schema";
import type { ListingSearchFilters } from "./listings";
import { canonicalizeFilters, type SubscriptionFrequency } from "./subscriptionFilters";

export type { SubscriptionFrequency } from "./subscriptionFilters";

export async function getExistingSubscription(
  userId: number,
  filters: ListingSearchFilters,
): Promise<{ id: number; frequency: SubscriptionFrequency } | undefined> {
  const filtersHash = canonicalizeFilters(filters);
  const [row] = await db
    .select({ id: searchSubscriptions.id, frequency: searchSubscriptions.frequency })
    .from(searchSubscriptions)
    .where(and(eq(searchSubscriptions.userId, userId), eq(searchSubscriptions.filtersHash, filtersHash)));
  return row ? { id: row.id, frequency: row.frequency as SubscriptionFrequency } : undefined;
}

export type UserSubscription = {
  id: number;
  filters: ListingSearchFilters;
  frequency: SubscriptionFrequency;
  createdAt: Date;
};

export async function getSubscriptionsForUser(userId: number): Promise<UserSubscription[]> {
  const rows = await db
    .select({
      id: searchSubscriptions.id,
      filters: searchSubscriptions.filters,
      frequency: searchSubscriptions.frequency,
      createdAt: searchSubscriptions.createdAt,
    })
    .from(searchSubscriptions)
    .where(eq(searchSubscriptions.userId, userId))
    .orderBy(desc(searchSubscriptions.createdAt));

  // jsonb columns come back untyped from drizzle — schema.ts can't import
  // ListingSearchFilters itself without a schema.ts <-> listings.ts import
  // cycle, so this cast happens at the read boundary instead.
  return rows.map((r) => ({ ...r, filters: r.filters as ListingSearchFilters, frequency: r.frequency as SubscriptionFrequency }));
}

/** Upserts on (userId, filtersHash) — subscribing again to the same search
 * with a different frequency just updates the existing row rather than
 * creating a second one. */
export async function upsertSubscription(
  userId: number,
  filters: ListingSearchFilters,
  frequency: SubscriptionFrequency,
): Promise<void> {
  const filtersHash = canonicalizeFilters(filters);
  const existing = await getExistingSubscription(userId, filters);

  if (existing) {
    await db.update(searchSubscriptions).set({ frequency }).where(eq(searchSubscriptions.id, existing.id));
    return;
  }

  await db.insert(searchSubscriptions).values({
    userId,
    filters,
    filtersHash,
    frequency,
    unsubscribeToken: randomBytes(32).toString("hex"),
  });
}

export async function deleteSubscription(id: number, userId: number): Promise<void> {
  await db.delete(searchSubscriptions).where(and(eq(searchSubscriptions.id, id), eq(searchSubscriptions.userId, userId)));
}

export async function updateSubscriptionFrequency(
  id: number,
  userId: number,
  frequency: SubscriptionFrequency,
): Promise<void> {
  await db
    .update(searchSubscriptions)
    .set({ frequency })
    .where(and(eq(searchSubscriptions.id, id), eq(searchSubscriptions.userId, userId)));
}

export async function deleteSubscriptionByToken(token: string): Promise<void> {
  await db.delete(searchSubscriptions).where(eq(searchSubscriptions.unsubscribeToken, token));
}
