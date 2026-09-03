import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { createSession } from "@/lib/auth/session";

// A Route Handler, not a page — createSession() writes a cookie, and
// Next.js only allows cookie writes from a Server Action or Route Handler,
// not from a Server Component's render (see session.ts's createSession).
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const userId = token ? await consumeAuthToken(token, "email_verification") : undefined;

  if (!userId) {
    return NextResponse.redirect(new URL("/verify-email/invalid", request.url));
  }

  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
  await createSession(userId);
  return NextResponse.redirect(new URL("/", request.url));
}
