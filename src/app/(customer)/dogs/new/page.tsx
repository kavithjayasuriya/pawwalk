import { DogForm } from '@/components/domain/DogForm';

export default function NewDogPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Add a new dog</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Fill in your dog&apos;s details. Fields marked with * are required.
      </p>
      <DogForm />
    </div>
  );
}