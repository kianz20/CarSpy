import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/logout";
import { isAdminEmail } from "@/lib/auth/admin";
import { getUnreadFeedbackCount } from "@/lib/feedback";

/** `layout="stack"` renders a vertical, touch-friendly list instead of the
 * default horizontal row — used inside MobileNavMenu's dropdown, which is
 * too narrow for the row layout that fits fine in the desktop header. */
export async function AuthNav({ layout = "row" }: { layout?: "row" | "stack" } = {}) {
  const user = await getCurrentUser();
  const stacked = layout === "stack";
  const linkClass = stacked
    ? "rounded-lg px-2 py-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
    : "text-muted hover:text-foreground";

  if (!user) {
    return (
      <div className={stacked ? "flex flex-col gap-1 text-sm font-medium" : "flex items-center gap-3 text-sm font-medium"}>
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
        <Link href="/register" className={stacked ? `${linkClass} font-semibold` : "btn btn-ghost py-1.5 text-xs"}>
          Register
        </Link>
      </div>
    );
  }

  const isAdmin = isAdminEmail(user.email);
  const unreadFeedbackCount = isAdmin ? await getUnreadFeedbackCount() : 0;

  return (
    <div className={stacked ? "flex flex-col gap-1 text-sm font-medium" : "flex items-center gap-3 text-sm font-medium"}>
      <Link href="/watchlist" className={linkClass}>
        Watchlist
      </Link>
      {isAdmin && (
        <Link href="/feedback" className={`relative flex items-center gap-1 ${linkClass}`}>
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
      <form action={logoutAction} className={stacked ? "px-2" : undefined}>
        <button type="submit" className={stacked ? "text-muted hover:text-foreground" : "btn btn-ghost py-1.5 text-xs"}>
          Log out
        </button>
      </form>
    </div>
  );
}
