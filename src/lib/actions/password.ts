"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type ChangePasswordState = { error?: string; success?: boolean };

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be logged in to change your password" };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) return { error: "New password must be at least 8 characters" };
  if (newPassword !== confirmPassword) return { error: "New passwords don't match" };

  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id));
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return { error: "Current password is incorrect" };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return { success: true };
}
