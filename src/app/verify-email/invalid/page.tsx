import Link from "next/link";

export default function VerifyEmailInvalidPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card p-6 text-center">
        <h1 className="mb-3 text-xl font-extrabold tracking-tight">Link expired</h1>
        <p className="text-sm text-muted">
          This verification link is invalid or has expired. Log in to request a new one.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
