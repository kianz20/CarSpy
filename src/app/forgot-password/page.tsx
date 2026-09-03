import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card p-6">
        <h1 className="mb-6 text-xl font-extrabold tracking-tight">Reset your password</h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
