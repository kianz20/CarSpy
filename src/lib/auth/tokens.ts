import { randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { authTokens } from "@/db/schema";

export type AuthTokenPurpose = "email_verification" | "password_reset";

/** Issues a fresh opaque token for a user, same shape as session.ts's
 * createSession — a DB-backed lookup, not a signed/JWT token. Clears any
 * outstanding unused tokens for the same (userId, purpose) first so an
 * older email link can't still work after a newer one was requested. */
export async function createAuthToken(
  userId: number,
  purpose: AuthTokenPurpose,
  ttlMs: number,
): Promise<string> {
  await db.delete(authTokens).where(
    and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt)),
  );

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMs);
  await db.insert(authTokens).values({ userId, purpose, token, expiresAt });
  return token;
}

/** Validates and burns a token in one step — returns the owning userId if
 * it's unused and unexpired, undefined otherwise. Marking it used here
 * (rather than leaving that to the caller) means a token can't be replayed
 * even if the caller's follow-up logic fails partway through. */
export async function consumeAuthToken(
  token: string,
  purpose: AuthTokenPurpose,
): Promise<number | undefined> {
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.token, token),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: authTokens.userId });

  return row?.userId;
}
