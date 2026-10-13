import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDogsByCustomer } from '@/lib/queries/dogs';
import { BookingWizard } from '@/components/domain/BookingWizard';

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const dogs = await getDogsByCustomer();

  const { data: services } = await supabase
    .from('walking_services')
    .select('id, name, duration_minutes, description, base_price_cents')
    .eq('is_active', true)
    .order('sort_order');

  // Get profile defaults
  const { data: profile } = await supabase
    .from('profiles')
    .select('default_address, default_address_notes')
    .eq('id', user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Book a walk</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Follow the steps below to schedule a walk for your dog.
      </p>
      <BookingWizard
        dogs={dogs}
        services={services ?? []}
        defaultAddress={profile?.default_address ?? ''}
        defaultNotes={profile?.default_address_notes ?? ''}
      />
    </div>
  );
}