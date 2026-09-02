"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" className="field" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Password</span>
        <input type="password" name="password" required autoComplete="current-password" className="field" />
      </label>

      {state.error && <p className="text-xs font-medium text-red-500">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
        {pending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-xs text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
