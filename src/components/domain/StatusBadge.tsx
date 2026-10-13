import type { BookingStatus } from '@/lib/types/booking';
import { STATUS_LABELS, STATUS_COLOURS } from '@/lib/types/booking';

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOURS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}