import Link from 'next/link';
import { getDogsByCustomer } from '@/lib/queries/dogs';
import { DogCard } from '@/components/domain/DogCard';

export default async function DogsPage() {
  const dogs = await getDogsByCustomer();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Dogs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your dog profiles for walk bookings.
          </p>
        </div>
        <Link
          href="/dogs/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add Dog
        </Link>
      </div>

      {dogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <div className="mb-3 text-4xl">🐕</div>
          <h2 className="mb-2 text-lg font-semibold text-zinc-700">
            No dogs yet
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Add your first dog profile to get started with walk bookings.
          </p>
          <Link
            href="/dogs/new"
            className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add your first dog
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </div>
      )}
    </div>
  );
}