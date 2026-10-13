import { notFound } from 'next/navigation';
import { getDogById } from '@/lib/queries/dogs';
import { DogForm } from '@/components/domain/DogForm';

interface EditDogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDogPage({ params }: EditDogPageProps) {
  const { id } = await params;
  const dog = await getDogById(id);

  if (!dog) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">
        Edit {dog.name}
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Update your dog&apos;s details below.
      </p>
      <DogForm dog={dog} />
    </div>
  );
}