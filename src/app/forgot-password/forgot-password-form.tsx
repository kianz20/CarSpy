"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.message) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted">{state.message}</p>
        <Link href="/login" className="text-sm text-accent hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" className="field" />
      </label>

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-xs text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
