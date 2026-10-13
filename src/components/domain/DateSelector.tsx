'use client';

import { getNextDates, formatShortDate } from '@/lib/utils/dates';
import { MAX_ADVANCE_DAYS } from '@/lib/constants/schedule';

interface DateSelectorProps {
  selectedDate: string | null;
  onChange: (date: string) => void;
}

export function DateSelector({ selectedDate, onChange }: DateSelectorProps) {
  const dates = getNextDates(MAX_ADVANCE_DAYS);

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
      {dates.map((date) => {
        const isSelected = selectedDate === date;
        return (
          <button
            key={date}
            type="button"
            onClick={() => onChange(date)}
            className={`rounded-lg border p-2 text-center text-sm transition-colors ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-700 ring-1 ring-emerald-500'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
            }`}
          >
            {formatShortDate(date)}
          </button>
        );
      })}
    </div>
  );
}