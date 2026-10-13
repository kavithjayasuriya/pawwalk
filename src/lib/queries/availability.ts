import { createClient } from '@/lib/supabase/server';
import type { TimeSlot } from '@/lib/types/booking';

export async function getAvailableSlots(
  serviceId: string,
  date: string
): Promise<TimeSlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_available_slots', {
    p_service_id: serviceId,
    p_date: date,
  });

  if (error) {
    console.error('Error fetching available slots:', error.message);
    return [];
  }

  return data ?? [];
}