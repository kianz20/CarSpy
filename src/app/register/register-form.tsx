"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" className="field" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Password</span>
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
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
