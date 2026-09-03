"use client";

import { useActionState, useEffect } from "react";
import { submitFeedbackAction, type SubmitFeedbackState } from "@/lib/actions/feedback";

const initialState: SubmitFeedbackState = {};

/** The actual feedback textarea/submit, shared by the desktop fixed
 * FeedbackButton popover and the mobile hamburger menu's inline version —
 * split out so both only need to own their own trigger/positioning. */
export function FeedbackForm({ pageUrl, onSent }: { pageUrl: string; onSent?: () => void }) {
  const [state, formAction, pending] = useActionState(submitFeedbackAction, initialState);

  useEffect(() => {
    if (!state.success) return;
    const timeout = setTimeout(() => onSent?.(), 1800);
    return () => clearTimeout(timeout);
  }, [state.success, onSent]);

  if (state.success) {
    return (
      <p className="py-2 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
        Thanks — feedback sent!
      </p>
    );
  }

  return (
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
  );
}
