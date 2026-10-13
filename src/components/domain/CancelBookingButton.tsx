'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cancelBooking } from '@/lib/actions/bookings';

interface CancelBookingButtonProps {
  bookingId: string;
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set('bookingId', bookingId);
    if (reason.trim()) formData.set('reason', reason.trim());

    const result = await cancelBooking(formData);

    if ('error' in result) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/bookings');
    }
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Cancel booking
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="cancelReason"
          className="mb-1 block text-sm font-medium text-zinc-700"
        >
          Reason (optional)
        </label>
        <textarea
          id="cancelReason"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Why are you cancelling?"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Cancelling…' : 'Confirm cancellation'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setReason('');
            setError(null);
          }}
          disabled={loading}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Keep booking
        </button>
      </div>
    </div>
  );
}