'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cancelBookingSchema } from '@/lib/validators/booking';

type ActionResult = { success: true } | { error: string };

export async function cancelBooking(formData: FormData): Promise<ActionResult> {
  const parsed = cancelBookingSchema.safeParse({
    bookingId: formData.get('bookingId'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc('cancel_booking', {
    p_booking_id: parsed.data.bookingId,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/bookings');
  return { success: true };
}