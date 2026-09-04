import Link from "next/link";

export default function UnsubscribedPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card p-6 text-center">
        <h1 className="mb-3 text-xl font-extrabold tracking-tight">Alerts stopped</h1>
        <p className="text-sm text-muted">You won&apos;t get any more emails for that saved search.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-accent hover:underline">
          Back to CarSpy NZ
        </Link>
      </div>
    </div>
  );
}
