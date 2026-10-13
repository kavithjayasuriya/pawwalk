import { createClient } from '@supabase/supabase-js';

/**
 * Server-only admin client that bypasses Row Level Security.
 *
 * Uses the service-role key (SUPABASE_SECRET_KEY) which must NEVER
 * be exposed to frontend code. This client has no NEXT_PUBLIC_ prefix
 * in the env var, so it is only available server-side.
 *
 * Use ONLY for operations that genuinely require elevated access:
 *   - Creating walker/admin accounts programmatically
 *   - Database seeding
 *   - Background jobs that act on behalf of the system
 *
 * NEVER use this for ordinary customer or walker requests.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
