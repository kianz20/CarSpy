"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitFeedbackAction, type SubmitFeedbackState } from "@/lib/actions/feedback";

const initialState: SubmitFeedbackState = {};

/**
 * Fixed to the viewport corner rather than laid out inside the header's own
 * flex row — the ask was specifically to keep it "outside of the main page
 * borders" so it can never push the logo/AuthNav/ThemeToggle around, even
 * though visually it sits right beside the theme toggle.
 */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [state, formAction, pending] = useActionState(submitFeedbackAction, initialState);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!state.success) return;
    const timeout = setTimeout(() => setOpen(false), 1800);
    return () => clearTimeout(timeout);
  }, [state.success]);

  function handleToggle() {
    setOpen((wasOpen) => {
      // Read fresh each time it's opened rather than once on mount — this
      // component lives in the root layout, so it never remounts as the
      // user navigates client-side between pages.
      if (!wasOpen) setPageUrl(window.location.pathname + window.location.search);
      return !wasOpen;
    });
  }

  return (
    <div ref={rootRef} className="fixed right-4 top-2.5 z-30">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="btn-ghost flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium"
      >
        Feedback
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-lg">
          {state.success ? (
            <p className="py-2 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Thanks — feedback sent!
            </p>
          ) : (
            <form action={formAction} className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted">Send feedback</span>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Bugs, ideas, anything…"
                className="field text-sm"
              />
              <input type="email" name="email" placeholder="Email (optional, for a reply)" className="field text-sm" />
              <input type="hidden" name="pageUrl" value={pageUrl} readOnly />
              {state.error && <p className="text-xs font-medium text-red-500">{state.error}</p>}
              <button type="submit" disabled={pending} className="btn btn-primary py-1.5 text-sm">
                {pending ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
