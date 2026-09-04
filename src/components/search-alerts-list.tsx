"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  unsubscribeFromSearchAction,
  updateSubscriptionFrequencyAction,
} from "@/lib/actions/searchSubscriptions";
import { describeFilters, filtersToSearchParams, type SubscriptionFrequency } from "@/lib/search/subscriptionFilters";
import type { UserSubscription } from "@/lib/search/subscriptions";

export function SearchAlertsList({ subscriptions: initial }: { subscriptions: UserSubscription[] }) {
  const [subscriptions, setSubscriptions] = useState(initial);
  const [, startTransition] = useTransition();

  function handleFrequencyChange(id: number, frequency: SubscriptionFrequency) {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, frequency } : s)));
    startTransition(() => {
      void updateSubscriptionFrequencyAction(id, frequency);
    });
  }

  function handleUnsubscribe(id: number) {
    const previous = subscriptions;
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      const result = await unsubscribeFromSearchAction(id);
      if (!result.ok) setSubscriptions(previous);
    });
  }

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-muted">
        You haven&apos;t subscribed to any searches yet — subscribe from any search results page.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {subscriptions.map((sub) => (
        <li key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
          <Link
            href={`/?${filtersToSearchParams(sub.filters).toString()}`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            {describeFilters(sub.filters)}
          </Link>

          <div className="flex items-center gap-2">
            <select
              value={sub.frequency}
              onChange={(e) => handleFrequencyChange(sub.id, e.target.value as SubscriptionFrequency)}
              className="field w-auto py-1.5"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <button
              type="button"
              onClick={() => handleUnsubscribe(sub.id)}
              className="text-xs font-semibold text-danger hover:underline"
            >
              Stop alerts
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
