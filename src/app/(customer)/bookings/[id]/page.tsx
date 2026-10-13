import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBookingDetailById } from '@/lib/queries/bookings';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { PriceSummary } from '@/components/domain/PriceSummary';
import { CancelBookingButton } from '@/components/domain/CancelBookingButton';
import { formatBookingDate, formatBookingTime } from '@/lib/utils/dates';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const booking = await getBookingDetailById(id);
  if (!booking) notFound();

  const canCancel =
    booking.status === 'confirmed' && new Date(booking.starts_at) > new Date();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Booking detail</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {formatBookingDate(booking.starts_at)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="space-y-4">
        {/* Walk details */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 font-medium text-zinc-900">Walk details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Service</dt>
              <dd className="text-zinc-900">
                {booking.service.name} ({booking.service.duration_minutes} min)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Date</dt>
              <dd className="text-zinc-900">{formatBookingDate(booking.starts_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Time</dt>
              <dd className="text-zinc-900">
                {formatBookingTime(booking.starts_at)} – {formatBookingTime(booking.ends_at)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Walker</dt>
              <dd className="text-zinc-900">
                {booking.walker.first_name} {booking.walker.last_name}
              </dd>
            </div>
          </dl>
        </div>

        {/* Dogs */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 font-medium text-zinc-900">
            Dog{booking.dogs.length > 1 ? 's' : ''}
          </h2>
          <div className="space-y-2">
            {booking.dogs.map((dog) => (
              <div key={dog.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm">
                  🐕
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">{dog.name}</div>
                  {dog.breed && (
                    <div className="text-xs text-zinc-500">{dog.breed}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 font-medium text-zinc-900">Pickup</h2>
          <p className="text-sm text-zinc-900">{booking.pickup_address}</p>
          {booking.pickup_notes && (
            <p className="mt-1 text-sm text-zinc-500">{booking.pickup_notes}</p>
          )}
        </div>

        {/* Price */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 font-medium text-zinc-900">Price</h2>
          <PriceSummary
            basePriceCents={booking.base_price_cents}
            secondDogFeeCents={booking.second_dog_fee_cents}
            totalPriceCents={booking.total_price_cents}
            serviceName={booking.service.name}
            dogCount={booking.dogs.length}
          />
        </div>

        {/* Cancellation info */}
        {booking.status === 'cancelled' && booking.cancellation_reason && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 font-medium text-zinc-900">Cancellation reason</h2>
            <p className="text-sm text-zinc-600">{booking.cancellation_reason}</p>
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 font-medium text-zinc-900">Cancel this booking</h2>
            <CancelBookingButton bookingId={booking.id} />
          </div>
        )}
      </div>
    </div>
  );
}