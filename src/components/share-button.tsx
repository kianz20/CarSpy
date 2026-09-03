"use client";

import { useState } from "react";

/** Copies the clean, param-free listing URL — not the current location.href,
 * which usually carries the search's make/model/finance/sort params along
 * for "Back to search" and cost-estimate purposes (see listing/[id]/page.tsx).
 * Those params are meaningless to someone else opening a shared link; all
 * they need is the listing id. */
export function ShareButton({ listingId }: { listingId: number }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/listing/${listingId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — fall
      // back to a prompt so the URL is still obtainable rather than silently
      // doing nothing.
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button type="button" onClick={handleClick} className="btn btn-ghost">
      {copied ? "Copied!" : "Share ↗"}
    </button>
  );
}
