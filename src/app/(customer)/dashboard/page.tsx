import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDogCount } from '@/lib/queries/dogs';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.first_name || 'there';
  const dogCount = await getDogCount();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">
        Welcome back, {firstName} 👋
      </h1>
      <p className="mb-8 text-zinc-500">
        Here&apos;s an overview of your PawWalk account.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* My Dogs card */}
        <Link
          href="/dogs"
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-3 text-2xl">🐕</div>
          <h2 className="mb-1 text-lg font-semibold text-zinc-900">My Dogs</h2>
          <p className="mb-2 text-sm text-zinc-500">
            {dogCount === 0
              ? 'Add your first dog profile.'
              : `You have ${dogCount} dog${dogCount === 1 ? '' : 's'}.`}
          </p>
          <span className="text-sm font-medium text-emerald-600">
            {dogCount === 0 ? 'Get started →' : 'Manage dogs →'}
          </span>
        </Link>

        {/* Book a Walk card */}
        <Link
          href="/book"
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-3 text-2xl">📅</div>
          <h2 className="mb-1 text-lg font-semibold text-zinc-900">Book a Walk</h2>
          <p className="mb-2 text-sm text-zinc-500">
            Schedule a 30 or 60-minute walk for your dog.
          </p>
          <span className="text-sm font-medium text-emerald-600">
            Book now →
          </span>
        </Link>

        {/* My Bookings card */}
        <Link
          href="/bookings"
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-3 text-2xl">📋</div>
          <h2 className="mb-1 text-lg font-semibold text-zinc-900">My Bookings</h2>
          <p className="mb-2 text-sm text-zinc-500">
            View your upcoming and past bookings.
          </p>
          <span className="text-sm font-medium text-emerald-600">
            View bookings →
          </span>
        </Link>
      </div>
    </div>
  );
}
