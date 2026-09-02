import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/logout";

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

  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <Link href="/watchlist" className="text-muted hover:text-foreground">
        Watchlist
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="btn btn-ghost py-1.5 text-xs">
          Log out
        </button>
      </form>
    </div>
  );
}
