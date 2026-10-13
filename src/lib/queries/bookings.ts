import { createClient } from '@/lib/supabase/server';
import type { BookingDetail, BookingListItem } from '@/lib/types/booking';

/**
 * Get all bookings for the current customer, ordered by date.
 * Uses RLS — customer only sees own bookings.
 */
export async function getBookingsByCustomer(): Promise<BookingListItem[]> {
  const supabase = await createClient();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(
      'id, status, starts_at, ends_at, total_price_cents, service_id'
    )
    .order('starts_at', { ascending: false });

  if (error || !bookings) return [];

  // Fetch services for names/durations
  const { data: services } = await supabase
    .from('walking_services')
    .select('id, name, duration_minutes');

  const serviceMap = new Map(
    (services ?? []).map((s) => [s.id, s])
  );

  // Fetch dog names for each booking
  const results: BookingListItem[] = [];

  for (const b of bookings) {
    const { data: dogs } = await supabase
      .from('booking_dogs')
      .select('dog_id')
      .eq('booking_id', b.id);

    const dogIds = (dogs ?? []).map((d) => d.dog_id);
    let dogNames: string[] = [];

    if (dogIds.length > 0) {
      const { data: dogRows } = await supabase
        .from('dogs')
        .select('id, name')
        .in('id', dogIds);

      dogNames = (dogRows ?? []).map((d) => d.name);
    }

    const svc = serviceMap.get(b.service_id);

    results.push({
      id: b.id,
      status: b.status as BookingListItem['status'],
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      service_name: svc?.name ?? 'Walk',
      duration_minutes: svc?.duration_minutes ?? 30,
      dog_names: dogNames,
      total_price_cents: b.total_price_cents,
    });
  }

  return results;
}

/**
 * Get booking detail via the controlled RPC.
 * Returns full detail including customer, walker, and dog info.
 */
export async function getBookingDetailById(
  bookingId: string
): Promise<BookingDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_booking_detail', {
    p_booking_id: bookingId,
  });

  if (error || !data) return null;

  return data as unknown as BookingDetail;
}