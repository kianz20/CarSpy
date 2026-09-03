"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>New password</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
        />
        <span className="text-[10px] font-normal text-muted/80">At least 8 characters</span>
      </label>

      {state.error && <p className="text-xs font-medium text-red-500">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
        {pending ? "Resetting…" : "Reset password"}
      </button>

      <p className="text-center text-xs text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
