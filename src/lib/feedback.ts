import { desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { feedback, users } from "@/db/schema";

export async function submitFeedback(input: {
  userId?: number;
  email?: string;
  message: string;
  pageUrl?: string;
}): Promise<void> {
  await db.insert(feedback).values({
    userId: input.userId,
    email: input.email,
    message: input.message,
    pageUrl: input.pageUrl,
  });
}

/** All feedback, newest first, with the submitter's account email (if they
 * were logged in) alongside whatever email they typed in themselves. */
export async function getAllFeedback() {
  return db
    .select({
      id: feedback.id,
      message: feedback.message,
      email: feedback.email,
      pageUrl: feedback.pageUrl,
      createdAt: feedback.createdAt,
      readAt: feedback.readAt,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .orderBy(desc(feedback.createdAt));
}

/** Drives the admin nav's red bell badge. */
export async function getUnreadFeedbackCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedback)
    .where(isNull(feedback.readAt));
  return Number(row?.count ?? 0);
}

export async function markAllFeedbackRead(): Promise<void> {
  await db.update(feedback).set({ readAt: new Date() }).where(isNull(feedback.readAt));
}
