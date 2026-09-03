"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { verifyEmailHtml } from "@/lib/email/templates";

export type LoginState = { error?: string; unverifiedEmail?: string };
export type ResendState = { message?: string };

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db.select().from(users).where(eq(users.email, email));
  // Same message either way — doesn't reveal whether the email is registered.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }

  if (!user.emailVerifiedAt) {
    return { error: "Please verify your email before logging in.", unverifiedEmail: email };
  }

  await createSession(user.id);
  redirect("/");
}

export async function resendVerificationAction(_prevState: ResendState, formData: FormData): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const message = "If that account needs verifying, we've sent a new link.";

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (user && !user.emailVerifiedAt) {
    try {
      const token = await createAuthToken(user.id, "email_verification", EMAIL_VERIFICATION_TTL_MS);
      const link = `${process.env.APP_URL}/verify-email?token=${token}`;
      await sendEmail({ to: email, subject: "Verify your CarSpy NZ email", html: verifyEmailHtml(link) });
    } catch (err) {
      console.error("Failed to resend verification email —", err);
    }
  }

  return { message };
}
