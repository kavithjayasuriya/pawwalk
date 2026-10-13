import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <div className="mb-4 text-4xl">📧</div>
      <h1 className="mb-4 text-2xl font-bold text-zinc-900">
        Check your email
      </h1>
      <p className="mb-2 text-zinc-600">
        Check your email to continue. If you already have a PawWalk
        account, you can sign in or reset your password.
      </p>
      <p className="mb-6 text-sm text-zinc-400">
        The link will expire in 24 hours. Check your spam folder if you
        don&apos;t see it.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/login"
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Sign in
        </Link>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
