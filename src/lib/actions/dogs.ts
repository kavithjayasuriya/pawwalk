'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { dogFormSchema } from '@/lib/validators/dog';

type ActionResult = { success: true; dogId?: string } | { error: string };

/**
 * Create a new dog profile for the authenticated customer.
 */
export async function createDog(formData: FormData): Promise<ActionResult> {
  const parsed = dogFormSchema.safeParse({
    name: formData.get('name'),
    breed: formData.get('breed'),
    ageRange: formData.get('ageRange'),
    size: formData.get('size'),
    temperament: formData.get('temperament'),
    walkingBehaviorNotes: formData.get('walkingBehaviorNotes'),
    leadHarnessInstructions: formData.get('leadHarnessInstructions'),
    emergencyContactName: formData.get('emergencyContactName'),
    emergencyContactPhone: formData.get('emergencyContactPhone'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const d = parsed.data;

  const { data, error } = await supabase
    .from('dogs')
    .insert({
      customer_id: user.id,
      name: d.name,
      breed: d.breed || null,
      age_range: d.ageRange,
      size: d.size,
      temperament: d.temperament || null,
      walking_behavior_notes: d.walkingBehaviorNotes || null,
      lead_harness_instructions: d.leadHarnessInstructions || null,
      emergency_contact_name: d.emergencyContactName || null,
      emergency_contact_phone: d.emergencyContactPhone || null,
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dogs');
  return { success: true, dogId: data.id };
}

/**
 * Update an existing dog profile.
 * RLS ensures only the owner can update.
 */
export async function updateDog(
  dogId: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = dogFormSchema.safeParse({
    name: formData.get('name'),
    breed: formData.get('breed'),
    ageRange: formData.get('ageRange'),
    size: formData.get('size'),
    temperament: formData.get('temperament'),
    walkingBehaviorNotes: formData.get('walkingBehaviorNotes'),
    leadHarnessInstructions: formData.get('leadHarnessInstructions'),
    emergencyContactName: formData.get('emergencyContactName'),
    emergencyContactPhone: formData.get('emergencyContactPhone'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();

  const d = parsed.data;

  const { error } = await supabase
    .from('dogs')
    .update({
      name: d.name,
      breed: d.breed || null,
      age_range: d.ageRange,
      size: d.size,
      temperament: d.temperament || null,
      walking_behavior_notes: d.walkingBehaviorNotes || null,
      lead_harness_instructions: d.leadHarnessInstructions || null,
      emergency_contact_name: d.emergencyContactName || null,
      emergency_contact_phone: d.emergencyContactPhone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dogId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dogs');
  revalidatePath(`/dogs/${dogId}`);
  return { success: true };
}

/**
 * Soft-delete a dog by setting is_active = false.
 * RLS ensures only the owner can deactivate.
 */
export async function deactivateDog(dogId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('dogs')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', dogId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dogs');
  return { success: true };
}