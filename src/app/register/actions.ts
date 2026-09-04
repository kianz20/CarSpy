"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authTokens, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { verifyEmailHtml } from "@/lib/email/templates";

export type RegisterState = { error?: string };

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function registerAction(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) return { error: "Enter a valid email address" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { error: "An account with that email already exists" };

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning({ id: users.id });

  try {
    const token = await createAuthToken(user.id, "email_verification", EMAIL_VERIFICATION_TTL_MS);
    const link = `${process.env.APP_URL}/verify-email?token=${token}`;
    await sendEmail({ to: email, subject: "Verify your CarSpy NZ email", html: verifyEmailHtml(link) });
  } catch (err) {
    console.error("Failed to send verification email —", err);
    // Roll back so the address is free to retry registration with, rather
    // than being stuck unverified with no way to get another email out.
    // Token row first — it references the user row via a FK.
    await db.delete(authTokens).where(eq(authTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
    return { error: "Couldn't send verification email — please try again" };
  }

  redirect("/register/check-email");
}
