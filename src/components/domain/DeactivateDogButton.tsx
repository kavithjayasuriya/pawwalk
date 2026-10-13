'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deactivateDog } from '@/lib/actions/dogs';

interface DeactivateDogButtonProps {
  dogId: string;
  dogName: string;
}

export function DeactivateDogButton({ dogId, dogName }: DeactivateDogButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDeactivate() {
    setLoading(true);
    const result = await deactivateDog(dogId);
    if ('error' in result) {
      alert(result.error);
      setLoading(false);
    } else {
      router.push('/dogs');
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Remove dog
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-600">
        Remove <strong>{dogName}</strong>?
      </span>
      <button
        onClick={handleDeactivate}
        disabled={loading}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Removing…' : 'Confirm'}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        disabled={loading}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
      >
        Cancel
      </button>
    </div>
  );
}