import type { Dog } from '@/lib/types/dog';
import { formatPrice } from '@/lib/utils/dates';
import { formatShortDate } from '@/lib/utils/dates';

interface BookingReviewProps {
  selectedDogs: Dog[];
  serviceName: string;
  serviceDuration: number;
  basePriceCents: number;
  date: string;
  time: string;
  pickupAddress: string;
  pickupNotes: string;
  secondDogFeeCents: number;
  totalPriceCents: number;
}

export function BookingReview({
  selectedDogs,
  serviceName,
  serviceDuration,
  basePriceCents,
  date,
  time,
  pickupAddress,
  pickupNotes,
  secondDogFeeCents,
  totalPriceCents,
}: BookingReviewProps) {
  // Format time for display
  const [h, m] = time.substring(0, 5).split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const timeDisplay = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 font-medium text-zinc-900">Booking Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Service</dt>
            <dd className="text-zinc-900">{serviceName} ({serviceDuration} min)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Date</dt>
            <dd className="text-zinc-900">{formatShortDate(date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Time</dt>
            <dd className="text-zinc-900">{timeDisplay}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Dog{selectedDogs.length > 1 ? 's' : ''}</dt>
            <dd className="text-zinc-900">{selectedDogs.map((d) => d.name).join(', ')}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 font-medium text-zinc-900">Pickup</h3>
        <p className="text-sm text-zinc-900">{pickupAddress}</p>
        {pickupNotes && (
          <p className="mt-1 text-sm text-zinc-500">{pickupNotes}</p>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 font-medium text-zinc-900">Price</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">{serviceName}</span>
            <span className="text-zinc-900">{formatPrice(basePriceCents)}</span>
          </div>
          {selectedDogs.length === 2 && secondDogFeeCents > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Second dog</span>
              <span className="text-zinc-900">{formatPrice(secondDogFeeCents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-1 font-medium">
            <span className="text-zinc-900">Total</span>
            <span className="text-zinc-900">{formatPrice(totalPriceCents)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        A walker will be assigned automatically. Availability shown is advisory —
        final confirmation occurs when you submit.
      </p>
    </div>
  );
}