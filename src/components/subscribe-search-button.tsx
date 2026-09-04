"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { subscribeToSearchAction, unsubscribeFromSearchAction } from "@/lib/actions/searchSubscriptions";
import type { ListingSearchFilters } from "@/lib/search/listings";
import { describeFiltersDetailed, type SubscriptionFrequency } from "@/lib/search/subscriptionFilters";

const FREQUENCY_LABEL: Record<SubscriptionFrequency, string> = {
  daily: "daily",
  weekly: "weekly",
};

type Subscription = { id: number; frequency: SubscriptionFrequency };

/** "Get alerts for this search" — subscribes the current filters to a
 * daily/weekly email digest of new matches. Opens a modal (rather than a
 * plain on/off toggle like WatchlistButton) since there's a real choice to
 * confirm — frequency, plus a sentence spelling out exactly which filters
 * the subscription covers, so it's clear what "matches" will mean later
 * when the email arrives. Logged-out visitors get a link to /login instead,
 * same gating as the listing detail page's watchlist button. */
export function SubscribeSearchButton({
  filters,
  isLoggedIn,
  existingSubscription: initial,
}: {
  filters: ListingSearchFilters;
  isLoggedIn: boolean;
  existingSubscription?: Subscription;
}) {
  const [subscription, setSubscription] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pendingFrequency, setPendingFrequency] = useState<SubscriptionFrequency>(initial?.frequency ?? "daily");
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="text-sm font-semibold text-accent hover:underline">
        Log in to get alerts
      </Link>
    );
  }

  function handleOpen() {
    setPendingFrequency(subscription?.frequency ?? "daily");
    setOpen(true);
  }

  function handleConfirm() {
    const previous = subscription;
    // Optimistic id of 0 until the server confirms — nothing reads it before
    // then (the only action that needs a real id is unsubscribe, which the
    // user can't reach until this transition settles and replaces it).
    setSubscription({ id: previous?.id ?? 0, frequency: pendingFrequency });
    setOpen(false);

    startTransition(async () => {
      const result = await subscribeToSearchAction(filters, pendingFrequency);
      if (!result.ok) {
        setSubscription(previous);
        if (result.error === "not_authenticated") router.push("/login");
      } else {
        router.refresh(); // picks up the real subscription id from the server
      }
    });
  }

  function handleUnsubscribe() {
    if (!subscription) return;
    const previous = subscription;
    setSubscription(undefined);
    setOpen(false);

    startTransition(async () => {
      const result = await unsubscribeFromSearchAction(previous.id);
      if (!result.ok) {
        setSubscription(previous);
        if (result.error === "not_authenticated") router.push("/login");
      }
    });
  }

  const criteria = describeFiltersDetailed(filters);
  const criteriaText = criteria.length > 0 ? criteria.join(", ") : "this search";

  return (
    <>
      <button type="button" onClick={handleOpen} className={`btn ${subscription ? "btn-primary" : "btn-ghost"}`}>
        {subscription ? `🔔 Alerts: ${FREQUENCY_LABEL[subscription.frequency]}` : "🔔 Get alerts for this search"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="card relative z-10 w-full max-w-sm p-6">
            <h2 className="mb-3 text-lg font-bold tracking-tight">Get alerts for this search</h2>
            <p className="mb-5 text-sm text-muted">
              New listings for <span className="text-foreground">{criteriaText}</span> will be sent to your email{" "}
              <span className="font-semibold text-foreground">{FREQUENCY_LABEL[pendingFrequency]}</span>.
            </p>

            <div className="mb-5 flex gap-2">
              {(["daily", "weekly"] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setPendingFrequency(freq)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                    pendingFrequency === freq
                      ? "border-accent bg-accent/10 font-semibold text-accent"
                      : "border-border hover:bg-surface-2"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              {subscription ? (
                <button type="button" onClick={handleUnsubscribe} className="text-xs font-semibold text-danger hover:underline">
                  Unsubscribe
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="button" onClick={handleConfirm} className="btn btn-primary">
                  {subscription ? "Save" : "Subscribe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
