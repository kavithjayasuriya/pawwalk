/**
 * Thin client for the PawWalk Python (FastAPI) backend.
 *
 * Every request forwards the authenticated Supabase access token so
 * Supabase RLS remains authoritative.  The service-role / secret key
 * is NEVER used here.
 */

import { createClient } from '@/lib/supabase/client';

const API_BASE = process.env.NEXT_PUBLIC_PYTHON_API_URL ?? 'http://localhost:8000';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return session.access_token;
}

interface ApiResult {
  ok: boolean;
  status: number;
  data: unknown;
  error?: string;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<ApiResult> {
  let token: string;
  try {
    token = await getToken();
  } catch {
    return { ok: false, status: 0, data: null, error: 'Not authenticated' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Network error, DNS failure, CORS blocked, etc.
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Unable to connect to the booking service. Please try again.',
    };
  }

  // Safely parse the response body — may be empty or non-JSON.
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const errMsg =
      typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as Record<string, unknown>).detail)
        : 'Something went wrong. Please try again.';

    return { ok: false, status: res.status, data, error: errMsg };
  }

  return { ok: true, status: res.status, data };
}

// ── Booking ───────────────────────────────────────────────────

export interface CreateBookingPayload {
  service_id: string;
  dog_ids: string[];
  date: string;
  time: string;
  pickup_address: string;
  pickup_notes: string | null;
  idempotency_key: string;
}

export async function createBookingViaPython(
  payload: CreateBookingPayload
): Promise<{ bookingId: string } | { error: string }> {
  const result = await apiFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return { error: result.error ?? 'Something went wrong. Please try again.' };
  }

  const body = result.data as Record<string, unknown>;
  const bookingId =
    typeof body.booking_id === 'string' ? body.booking_id : String(body.booking_id);

  return { bookingId };
}