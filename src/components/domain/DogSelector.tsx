'use client';

import type { Dog } from '@/lib/types/dog';
import { MAX_DOGS_PER_BOOKING } from '@/lib/constants/schedule';

interface DogSelectorProps {
  dogs: Dog[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function DogSelector({ dogs, selectedIds, onChange }: DogSelectorProps) {
  function toggle(dogId: string) {
    if (selectedIds.includes(dogId)) {
      onChange(selectedIds.filter((id) => id !== dogId));
    } else if (selectedIds.length < MAX_DOGS_PER_BOOKING) {
      onChange([...selectedIds, dogId]);
    }
  }

  if (dogs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        You need to add a dog before booking.{' '}
        <a href="/dogs/new" className="text-emerald-600 font-medium">
          Add a dog →
        </a>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        Select 1 or 2 dogs for this walk.
      </p>
      {dogs.map((dog) => {
        const isSelected = selectedIds.includes(dog.id);
        return (
          <button
            key={dog.id}
            type="button"
            onClick={() => toggle(dog.id)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">
                🐕
              </div>
              <div>
                <div className="font-medium text-zinc-900">{dog.name}</div>
                <div className="text-sm text-zinc-500">
                  {dog.breed || 'Unknown breed'} · {dog.size || 'Unknown size'}
                </div>
              </div>
            </div>
          </button>
        );
      })}
      {selectedIds.length >= MAX_DOGS_PER_BOOKING && (
        <p className="text-xs text-zinc-400">Maximum {MAX_DOGS_PER_BOOKING} dogs per booking.</p>
      )}
    </div>
  );
}