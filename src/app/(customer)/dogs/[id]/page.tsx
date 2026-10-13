import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDogById } from '@/lib/queries/dogs';
import { AGE_RANGE_LABELS, SIZE_LABELS } from '@/lib/types/dog';
import { DeactivateDogButton } from '@/components/domain/DeactivateDogButton';

interface DogDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DogDetailPage({ params }: DogDetailPageProps) {
  const { id } = await params;
  const dog = await getDogById(id);

  if (!dog) {
    notFound();
  }

  const fields = [
    { label: 'Breed', value: dog.breed },
    { label: 'Age range', value: dog.age_range ? AGE_RANGE_LABELS[dog.age_range] : null },
    { label: 'Size', value: dog.size ? SIZE_LABELS[dog.size] : null },
    { label: 'Temperament', value: dog.temperament },
    { label: 'Walking behaviour / notes', value: dog.walking_behavior_notes },
    { label: 'Lead / harness instructions', value: dog.lead_harness_instructions },
    { label: 'Emergency contact name', value: dog.emergency_contact_name },
    { label: 'Emergency contact phone', value: dog.emergency_contact_phone },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            🐕
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{dog.name}</h1>
            {dog.breed && <p className="text-zinc-500">{dog.breed}</p>}
          </div>
        </div>
        <Link
          href={`/dogs/${dog.id}/edit`}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Edit
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4">
          {fields.map(({ label, value }) => (
            <div key={label} className="sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-zinc-500">{label}</dt>
              <dd className="mt-1 text-sm text-zinc-900 sm:col-span-2 sm:mt-0">
                {value || <span className="text-zinc-400">Not provided</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6">
        <Link
          href="/dogs"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          ← Back to My Dogs
        </Link>
        <DeactivateDogButton dogId={dog.id} dogName={dog.name} />
      </div>
    </div>
  );
}