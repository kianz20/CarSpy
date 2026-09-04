import { NextRequest, NextResponse } from "next/server";
import { deleteSubscriptionByToken } from "@/lib/search/subscriptions";

// One-click unsubscribe from an alert email footer — no login required
// (the token itself is the credential), same reasoning as verify-email's
// Route Handler.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (token) await deleteSubscriptionByToken(token);
  return NextResponse.redirect(new URL("/alerts/unsubscribed", request.url));
}
