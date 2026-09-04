"use client";

import { useState, useTransition } from "react";
import { setEmailOnPriceDropAlertsAction } from "@/lib/actions/watchlist";

/** One global switch for the whole watchlist (see schema.ts's
 * userSettings.emailOnPriceDropAlerts) — not a per-listing toggle. */
export function EmailPriceDropCheckbox({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [, startTransition] = useTransition();

  function handleChange(next: boolean) {
    const previous = enabled;
    setEnabled(next); // optimistic — same pattern as WatchlistButton

    startTransition(async () => {
      const result = await setEmailOnPriceDropAlertsAction(next);
      if (!result.ok) setEnabled(previous); // revert (not signed in, shouldn't happen here, but safe)
    });
  }

  return (
    <label className="flex w-fit items-center gap-2 text-sm text-muted select-none">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => handleChange(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-accent"
      />
      Email me when a car I watchlisted drops in price
    </label>
  );
}
