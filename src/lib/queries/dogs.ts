import { createClient } from '@/lib/supabase/server';
import type { Dog } from '@/lib/types/dog';

/**
 * Get all active dogs for the current authenticated customer.
 */
export async function getDogsByCustomer(): Promise<Dog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching dogs:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get a single dog by ID.
 * Returns null if not found or not owned by the current customer.
 */
export async function getDogById(dogId: string): Promise<Dog | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', dogId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get the count of active dogs for the current customer.
 * Used by the dashboard.
 */
export async function getDogCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('dogs')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) {
    return 0;
  }

  return count ?? 0;
}