import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card p-6 text-center">
        <h1 className="mb-3 text-xl font-extrabold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted">
          We&apos;ve sent a verification link to your email address. Click it to finish creating your account.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
