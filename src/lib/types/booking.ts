export const BOOKING_STATUSES = [
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLOURS: Record<BookingStatus, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-zinc-100 text-zinc-600',
};

export interface TimeSlot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

export interface BookingDetail {
  id: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  pickup_address: string;
  pickup_notes: string | null;
  base_price_cents: number;
  second_dog_fee_cents: number;
  total_price_cents: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  walker: {
    first_name: string;
    last_name: string;
  };
  service: {
    name: string;
    duration_minutes: number;
  };
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    size: string | null;
    temperament: string | null;
    walking_behavior_notes: string | null;
    lead_harness_instructions: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  }[];
}

export interface BookingListItem {
  id: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  service_name: string;
  duration_minutes: number;
  dog_names: string[];
  total_price_cents: number;
}