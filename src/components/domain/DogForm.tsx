'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dog } from '@/lib/types/dog';
import { DOG_AGE_RANGES, DOG_SIZES, AGE_RANGE_LABELS, SIZE_LABELS } from '@/lib/types/dog';
import { createDog, updateDog } from '@/lib/actions/dogs';

interface DogFormProps {
  dog?: Dog;
}

export function DogForm({ dog }: DogFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = !!dog;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = isEditing
      ? await updateDog(dog.id, formData)
      : await createDog(formData);
    if ('error' in result) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(isEditing ? `/dogs/${dog.id}` : result.dogId ? `/dogs/${result.dogId}` : '/dogs');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
          Dog name <span className="text-red-500">*</span>
        </label>
        <input id="name" name="name" type="text" required maxLength={100}
          defaultValue={dog?.name ?? ''}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Buddy" />
      </div>

      <div>
        <label htmlFor="breed" className="mb-1 block text-sm font-medium text-zinc-700">
          Breed <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input id="breed" name="breed" type="text" maxLength={100}
          defaultValue={dog?.breed ?? ''}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Golden Retriever" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ageRange" className="mb-1 block text-sm font-medium text-zinc-700">
            Age range <span className="text-red-500">*</span>
          </label>
          <select id="ageRange" name="ageRange" required defaultValue={dog?.age_range ?? ''}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="" disabled>Select age range</option>
            {DOG_AGE_RANGES.map((v) => (
              <option key={v} value={v}>{AGE_RANGE_LABELS[v]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="size" className="mb-1 block text-sm font-medium text-zinc-700">
            Size <span className="text-red-500">*</span>
          </label>
          <select id="size" name="size" required defaultValue={dog?.size ?? ''}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="" disabled>Select size</option>
            {DOG_SIZES.map((v) => (
              <option key={v} value={v}>{SIZE_LABELS[v]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="temperament" className="mb-1 block text-sm font-medium text-zinc-700">
          Temperament <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input id="temperament" name="temperament" type="text" maxLength={500}
          defaultValue={dog?.temperament ?? ''}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Friendly, energetic, good with other dogs" />
      </div>

      <div>
        <label htmlFor="walkingBehaviorNotes" className="mb-1 block text-sm font-medium text-zinc-700">
          Walking behaviour / notes <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <textarea id="walkingBehaviorNotes" name="walkingBehaviorNotes" rows={3} maxLength={1000}
          defaultValue={dog?.walking_behavior_notes ?? ''}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Pulls on lead near squirrels, prefers slow pace" />
      </div>

      <div>
        <label htmlFor="leadHarnessInstructions" className="mb-1 block text-sm font-medium text-zinc-700">
          Lead / harness instructions <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <textarea id="leadHarnessInstructions" name="leadHarnessInstructions" rows={2} maxLength={500}
          defaultValue={dog?.lead_harness_instructions ?? ''}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Uses front-clip harness, double-clip lead" />
      </div>

      <fieldset className="rounded-md border border-zinc-200 p-4">
        <legend className="px-2 text-sm font-medium text-zinc-700">
          Emergency contact <span className="text-zinc-400 font-normal">(optional)</span>
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="emergencyContactName" className="mb-1 block text-sm font-medium text-zinc-600">Contact name</label>
            <input id="emergencyContactName" name="emergencyContactName" type="text" maxLength={100}
              defaultValue={dog?.emergency_contact_name ?? ''}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Jane Smith" />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className="mb-1 block text-sm font-medium text-zinc-600">Contact phone</label>
            <input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" maxLength={20}
              defaultValue={dog?.emergency_contact_phone ?? ''}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 0400 123 456" />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-4">
        <button type="submit" disabled={loading}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save changes' : 'Add dog')}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
          Cancel
        </button>
      </div>
    </form>
  );
}