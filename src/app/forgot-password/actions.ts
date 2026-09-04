"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordHtml } from "@/lib/email/templates";

export type ForgotPasswordState = { message?: string };

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const message = "If that email address has an account, we've sent a reset link.";

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (user) {
    try {
      const token = await createAuthToken(user.id, "password_reset", PASSWORD_RESET_TTL_MS);
      const link = `${process.env.APP_URL}/reset-password?token=${token}`;
      await sendEmail({ to: email, subject: "Reset your CarSpy NZ password", html: resetPasswordHtml(link) });
    } catch (err) {
      console.error("Failed to send password reset email —", err);
    }
  }

  // Same message regardless of whether the account exists or the send
  // succeeded — doesn't reveal whether an email is registered.
  return { message };
}
