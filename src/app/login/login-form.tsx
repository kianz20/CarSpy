"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, resendVerificationAction, type LoginState, type ResendState } from "./actions";

const initialState: LoginState = {};
const initialResendState: ResendState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          <span>Email</span>
          <input type="email" name="email" required autoComplete="email" className="field" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          <div className="flex items-center justify-between">
            <span>Password</span>
            <Link href="/forgot-password" className="text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <input type="password" name="password" required autoComplete="current-password" className="field" />
        </label>

        {state.error && <p className="text-xs font-medium text-red-500">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      {state.unverifiedEmail && <ResendVerificationForm email={state.unverifiedEmail} />}

      <p className="text-center text-xs text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

/** Its own form, not another button in LoginForm's — mixing multiple
 * server actions on buttons within a single <form> via formAction overrides
 * didn't reliably route to the right action in testing, so this stays a
 * separate form entirely, submitted with the same email the user just typed. */
export function ResendVerificationForm({ email }: { email: string }) {
  const [resendState, resendFormAction, resendPending] = useActionState(resendVerificationAction, initialResendState);

  if (resendState.message) {
    return <p className="text-xs font-medium text-muted">{resendState.message}</p>;
  }

  return (
    <form action={resendFormAction}>
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={resendPending}
        className="text-left text-xs font-semibold text-accent hover:underline"
      >
        {resendPending ? "Sending…" : "Resend verification email"}
      </button>
    </form>
  );
}
