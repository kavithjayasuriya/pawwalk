import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Allowlist of safe internal redirect destinations. */
const ALLOWED_NEXT = new Set(['/dashboard', '/reset-password']);

function safeRedirect(next: string | null): string {
  if (next && ALLOWED_NEXT.has(next)) {
    return next;
  }
  return '/dashboard';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next');

  const supabase = await createClient();

  // Path 1: PKCE code exchange (Supabase default email links)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'confirmation_failed');
      return new Response(null, { status: 302, headers: { Location: url.toString() } });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: safeRedirect(next) },
    });
  }

  // Path 2: OTP token hash verification (custom email template)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'recovery' | 'invite' | 'email_change',
    });

    if (error) {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'confirmation_failed');
      return new Response(null, { status: 302, headers: { Location: url.toString() } });
    }

    // For recovery type, always redirect to reset-password.
    if (type === 'recovery') {
      return new Response(null, { status: 302, headers: { Location: '/reset-password' } });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: safeRedirect(next) },
    });
  }

  // Path 3: Neither code nor token_hash present — redirect with error
  const url = new URL('/login', request.url);
  url.searchParams.set('error', 'missing_token');
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}
