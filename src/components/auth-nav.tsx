import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/logout";
import { isAdminEmail } from "@/lib/auth/admin";
import { getUnreadFeedbackCount } from "@/lib/feedback";

export async function AuthNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm font-medium">
        <Link href="/login" className="text-muted hover:text-foreground">
          Log in
        </Link>
        <Link href="/register" className="btn btn-ghost py-1.5 text-xs">
          Register
        </Link>
      </div>
    );
  }

  const isAdmin = isAdminEmail(user.email);
  const unreadFeedbackCount = isAdmin ? await getUnreadFeedbackCount() : 0;

  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <Link href="/watchlist" className="text-muted hover:text-foreground">
        Watchlist
      </Link>
      {isAdmin && (
        <Link href="/feedback" className="relative flex items-center gap-1 text-muted hover:text-foreground">
          Feedback
          {unreadFeedbackCount > 0 && (
            <span
              aria-label={`${unreadFeedbackCount} unread`}
              className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            >
              {unreadFeedbackCount > 9 ? "9+" : unreadFeedbackCount}
            </span>
          )}
        </Link>
      )}
      <form action={logoutAction}>
        <button type="submit" className="btn btn-ghost py-1.5 text-xs">
          Log out
        </button>
      </form>
    </div>
  );
}
