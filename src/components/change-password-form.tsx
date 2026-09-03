"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/lib/actions/password";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Current password</span>
        <input type="password" name="currentPassword" required autoComplete="current-password" className="field" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>New password</span>
        <input
          type="password"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
        />
        <span className="text-[10px] font-normal text-muted/80">At least 8 characters</span>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Confirm new password</span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
        />
      </label>

      {state.error && <p className="text-xs font-medium text-red-500">{state.error}</p>}
      {state.success && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Password updated!</p>}

      <button type="submit" disabled={pending} className="btn btn-primary py-2.5">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
