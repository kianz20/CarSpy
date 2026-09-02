"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export type RegisterState = { error?: string };

export async function registerAction(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) return { error: "Enter a valid email address" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { error: "An account with that email already exists" };

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning({ id: users.id });

  await createSession(user.id);
  redirect("/");
}
