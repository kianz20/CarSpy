import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card p-6">
        <h1 className="mb-6 text-xl font-extrabold tracking-tight">Log in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
