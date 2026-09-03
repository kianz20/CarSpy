"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, sessions } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { consumeAuthToken } from "@/lib/auth/tokens";

export type ResetPasswordState = { error?: string };

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const userId = await consumeAuthToken(token, "password_reset");
  if (!userId) return { error: "This reset link is invalid or has expired." };

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  // Force re-login everywhere else — standard practice after a password
  // reset, in case the old password leaked and a session is already open
  // somewhere the account owner doesn't control.
  await db.delete(sessions).where(eq(sessions.userId, userId));

  await createSession(userId);
  redirect("/");
}
