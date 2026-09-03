import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { getAllFeedback } from "@/lib/feedback";
import { markAllFeedbackReadAction } from "@/lib/actions/feedback";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) redirect("/");

  const rows = await getAllFeedback();
  const unreadCount = rows.filter((r) => r.readAt === null).length;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Feedback</h1>
          <p className="mt-1 text-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllFeedbackReadAction}>
            <button type="submit" className="btn btn-ghost">
              Mark all as read
            </button>
          </form>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
          <div className="text-3xl">💬</div>
          <p className="text-sm font-medium">No feedback yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`card flex flex-col gap-2 p-4 ${row.readAt === null ? "border-accent/40" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  {new Date(row.createdAt).toLocaleString("en-NZ")}
                  {row.pageUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-mono text-[11px]" title={row.pageUrl}>
                        {row.pageUrl.length > 40 ? `${row.pageUrl.slice(0, 40)}…` : row.pageUrl}
                      </span>
                    </>
                  )}
                </span>
                {row.readAt === null && (
                  <span className="pill bg-accent/12 text-accent">Unread</span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm">{row.message}</p>
              {(row.userEmail || row.email) && (
                <p className="text-xs text-muted">From: {row.userEmail ?? row.email}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
