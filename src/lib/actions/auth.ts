'use server';

import { createClient } from '@/lib/supabase/server';
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validators/auth';

export type AuthResult = { success: true } | { error: string };

const GENERIC_ERROR =
  "We couldn't create your account right now. Please try again shortly.";

/**
 * Known Supabase signup error messages that relate to an existing
 * account. These must NOT be surfaced to the user because they would
 * disclose whether an email is already registered.
 */
function isAccountExistsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already') ||
    lower.includes('already exists') ||
    lower.includes('duplicate')
  );
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? 'Invalid input' };
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    // If the error is related to an existing account, silently absorb it
    // and return success so the user sees the neutral check-email screen.
    // This prevents account enumeration.
    if (isAccountExistsError(error.message)) {
      return { success: true };
    }

    // Genuine operational errors (network, rate limit, server error, etc.)
    // are shown as a generic message — never the raw Supabase error.
    return { error: GENERIC_ERROR };
  }

  return { success: true };
}

export async function login(formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Supabase's "Invalid login credentials" message is already neutral
    // (does not reveal whether email or password is wrong).
    return { error: error.message };
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function forgotPassword(
  formData: FormData
): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
    }
  );

  if (error) {
    // Supabase returns { error: null } for non-existent emails (correct
    // security behaviour). If we DO get an error, it is a genuine
    // operational failure — but we must not expose the raw message
    // because it could indirectly confirm account existence.
    return {
      error:
        "We couldn't send password reset instructions right now. Please try again shortly.",
    };
  }

  // No error — email may or may not exist. Show the neutral message.
  return { success: true };
}

export async function resetPassword(
  formData: FormData
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();

  // Verify the user has an active session (established by the recovery flow).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: 'Your password reset session has expired. Please request a new reset link.',
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: 'Failed to update password. Please try again.' };
  }

  // Sign the user out after password reset so they log in with the new password.
  await supabase.auth.signOut();

  return { success: true };
}
