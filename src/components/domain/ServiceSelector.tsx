'use client';

import { formatPrice } from '@/lib/utils/dates';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  description: string | null;
  base_price_cents: number;
}

interface ServiceSelectorProps {
  services: Service[];
  selectedId: string | null;
  dogCount: number;
  onChange: (id: string) => void;
}

export function ServiceSelector({
  services,
  selectedId,
  dogCount,
  onChange,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      {services.map((svc) => {
        const isSelected = selectedId === svc.id;
        const extraFee = dogCount === 2 ? 1000 : 0;
        const total = svc.base_price_cents + extraFee;

        return (
          <button
            key={svc.id}
            type="button"
            onClick={() => onChange(svc.id)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-zinc-900">{svc.name}</div>
                <div className="text-sm text-zinc-500">
                  {svc.duration_minutes} minutes
                </div>
                {svc.description && (
                  <div className="mt-1 text-sm text-zinc-400">
                    {svc.description}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium text-zinc-900">
                  {formatPrice(total)}
                </div>
                {dogCount === 2 && (
                  <div className="text-xs text-zinc-400">
                    incl. $10 second dog
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}