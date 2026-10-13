import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBookingsByCustomer } from '@/lib/queries/bookings';
import { BookingCard } from '@/components/domain/BookingCard';

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const bookings = await getBookingsByCustomer();
  const now = new Date();

  const upcoming = bookings.filter((b) => {
    const isFuture = new Date(b.starts_at) > now;
    const isActive = b.status === 'confirmed' || b.status === 'in_progress';
    return isFuture && isActive;
  });

  const previous = bookings.filter((b) => {
    const isPast = new Date(b.starts_at) <= now;
    const isCancelled = b.status === 'cancelled';
    const isCompleted = b.status === 'completed';
    return isPast || isCancelled || isCompleted;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            View your upcoming and past bookings.
          </p>
        </div>
        <Link
          href="/book"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Book a walk
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <div className="mb-3 text-4xl">📋</div>
          <h2 className="mb-2 text-lg font-semibold text-zinc-700">No bookings yet</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Book your first walk to get started.
          </p>
          <Link
            href="/book"
            className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Book a walk
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </section>
          )}

          {previous.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">Previous</h2>
              <div className="space-y-3">
                {previous.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}