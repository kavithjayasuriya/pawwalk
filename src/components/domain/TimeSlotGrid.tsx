'use client';

import type { TimeSlot } from '@/lib/types/booking';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onChange: (time: string) => void;
  loading: boolean;
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onChange,
  loading,
}: TimeSlotGridProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-zinc-400">
        Loading available times…
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-400">
        No time slots available for this date and service.
      </div>
    );
  }

  const available = slots.filter((s) => s.is_available);

  if (available.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        All slots are booked for this date. Please try another date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {slots.map((slot) => {
        if (!slot.is_available) return null;

        const timeStr = slot.slot_start.substring(0, 5); // HH:MM
        const isSelected = selectedTime === timeStr;

        // Format for display (e.g. 09:00 → 9:00 AM)
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const display = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;

        return (
          <button
            key={timeStr}
            type="button"
            onClick={() => onChange(timeStr)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-700 ring-1 ring-emerald-500'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
            }`}
          >
            {display}
          </button>
        );
      })}
    </div>
  );
}