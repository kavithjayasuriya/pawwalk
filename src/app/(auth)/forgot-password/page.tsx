'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/actions/auth';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await forgotPassword(formData);

    if ('error' in result) {
      setError(result.error);
      setLoading(false);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">📧</div>
        <h1 className="mb-4 text-2xl font-bold text-zinc-900">
          Check your email
        </h1>
        <p className="mb-6 text-zinc-600">
          If an account exists for that email, we&apos;ve sent password
          reset instructions.
        </p>
        <p className="mb-6 text-sm text-zinc-400">
          The link will expire in 24 hours. Check your spam folder if you
          don&apos;t see it.
        </p>
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:text-emerald-500"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">
        Reset your password
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Enter your email address and we&apos;ll send you a link to reset
        your password.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:text-emerald-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}