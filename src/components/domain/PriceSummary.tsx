import { formatPrice } from '@/lib/utils/dates';

interface PriceSummaryProps {
  basePriceCents: number;
  secondDogFeeCents: number;
  totalPriceCents: number;
  serviceName: string;
  dogCount: number;
}

export function PriceSummary({
  basePriceCents,
  secondDogFeeCents,
  totalPriceCents,
  serviceName,
  dogCount,
}: PriceSummaryProps) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-zinc-600">{serviceName}</span>
        <span className="text-zinc-900">{formatPrice(basePriceCents)}</span>
      </div>
      {dogCount === 2 && secondDogFeeCents > 0 && (
        <div className="flex justify-between">
          <span className="text-zinc-600">Second dog</span>
          <span className="text-zinc-900">{formatPrice(secondDogFeeCents)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-zinc-200 pt-1 font-medium">
        <span className="text-zinc-900">Total</span>
        <span className="text-zinc-900">{formatPrice(totalPriceCents)}</span>
      </div>
    </div>
  );
}