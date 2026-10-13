import Link from 'next/link';
import type { BookingListItem } from '@/lib/types/booking';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatBookingDate, formatBookingTime, formatPrice } from '@/lib/utils/dates';

export function BookingCard({ booking }: { booking: BookingListItem }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-sm font-medium text-zinc-900">
            {formatBookingDate(booking.starts_at)}
          </div>
          <div className="text-sm text-zinc-500">
            {formatBookingTime(booking.starts_at)} · {booking.duration_minutes} min
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            {booking.service_name}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            {booking.dog_names.length > 0
              ? booking.dog_names.join(', ')
              : 'No dogs'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={booking.status} />
          <span className="text-sm font-medium text-zinc-900">
            {formatPrice(booking.total_price_cents)}
          </span>
        </div>
      </div>
    </Link>
  );
}