import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <div className="card p-6 text-center">
          <h1 className="mb-3 text-xl font-extrabold tracking-tight">Link invalid</h1>
          <p className="text-sm text-muted">This reset link is missing its token.</p>
          <Link href="/forgot-password" className="mt-6 inline-block text-sm text-accent hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card p-6">
        <h1 className="mb-6 text-xl font-extrabold tracking-tight">Choose a new password</h1>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
