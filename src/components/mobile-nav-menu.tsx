"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FeedbackForm } from "@/components/feedback-form";

/** Small-screen replacement for the header's Log in/Register (or Watchlist/
 * Feedback-inbox/Log out), Settings link, and the fixed feedback button —
 * on narrow screens those all fight for the same top-right corner, so below
 * `sm` they're folded into this single hamburger instead. `authNav` is
 * rendered server-side (AuthNav is an async server component and can't be
 * imported from this client component) and passed in as already-resolved
 * JSX from layout.tsx. */
export function MobileNavMenu({ authNav }: { authNav: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setFeedbackOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleToggle() {
    setOpen((wasOpen) => {
      if (!wasOpen) setPageUrl(window.location.pathname + window.location.search);
      else setFeedbackOpen(false);
      return !wasOpen;
    });
  }

  return (
    <div ref={rootRef} className="relative sm:hidden">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-label="Menu"
        className="btn-ghost flex h-8 w-8 items-center justify-center rounded-full !p-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <div
            className="flex flex-col gap-1"
            // Closes the menu on any plain nav link (Log in/Register/
            // Watchlist/Feedback inbox/Settings) without needing AuthNav
            // (a server component) to hold a client onClick itself.
            onClickCapture={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {authNav}
            <Link
              href="/settings"
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={() => setFeedbackOpen((v) => !v)}
              className="rounded-lg px-2 py-1.5 text-left text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
            >
              Send feedback
            </button>
            {feedbackOpen && (
              <div className="mt-1 border-t border-border pt-2">
                <FeedbackForm pageUrl={pageUrl} onSent={() => setOpen(false)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
