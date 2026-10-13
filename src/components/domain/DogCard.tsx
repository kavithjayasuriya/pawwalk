import Link from 'next/link';
import type { Dog } from '@/lib/types/dog';
import { AGE_RANGE_LABELS, SIZE_LABELS } from '@/lib/types/dog';

interface DogCardProps {
  dog: Dog;
}

export function DogCard({ dog }: DogCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Placeholder avatar */}
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          🐕
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-zinc-900">
            {dog.name}
          </h3>
          {dog.breed && (
            <p className="text-sm text-zinc-500">{dog.breed}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {dog.age_range && (
              <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                {AGE_RANGE_LABELS[dog.age_range]}
              </span>
            )}
            {dog.size && (
              <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                {SIZE_LABELS[dog.size]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3 border-t border-zinc-100 pt-4">
        <Link
          href={`/dogs/${dog.id}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          View
        </Link>
        <Link
          href={`/dogs/${dog.id}/edit`}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}