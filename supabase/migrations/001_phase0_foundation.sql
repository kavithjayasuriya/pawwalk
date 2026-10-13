-- ============================================================
-- PAWWALK V1 — PHASE 0: FOUNDATION
-- ============================================================
-- Run this migration manually in the Supabase SQL Editor.
-- Do NOT run this automatically via CLI or API.
-- ============================================================

BEGIN;

-- SCHEMAS
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                    TEXT NOT NULL DEFAULT 'customer'
                            CHECK (role IN ('customer', 'walker', 'admin')),
  accepts_walks           BOOLEAN NOT NULL DEFAULT FALSE,
  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  email                   TEXT NOT NULL UNIQUE,
  phone                   TEXT,
  default_address         TEXT,
  default_address_notes   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WALKING SERVICES TABLE
CREATE TABLE public.walking_services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.walking_services (name, duration_minutes, description, sort_order)
VALUES
  ('30-Minute Walk', 30, 'A brisk 30-minute walk for your dog.', 1),
  ('60-Minute Walk', 60, 'A full hour walk with plenty of time for exploration.', 2);

-- AUTH TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, accepts_walks, first_name, last_name, email, phone)
  VALUES (
    NEW.id, 'customer', FALSE,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Revoke direct EXECUTE on the trigger function.
-- The trigger fires via the auth system (table owner context),
-- not via a normal function call. Revoking EXECUTE from PUBLIC,
-- anon, and authenticated prevents any role from calling this
-- function directly via RPC or SQL.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ROLE HELPER (prevents recursive RLS on profiles)
CREATE OR REPLACE FUNCTION private.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.role FROM public.profiles p WHERE p.id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION private.get_current_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.get_current_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION private.get_current_user_role() TO authenticated;

-- CONTROLLED PROFILE UPDATE RPC
CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_first_name            TEXT,
  p_last_name             TEXT,
  p_phone                 TEXT,
  p_default_address       TEXT,
  p_default_address_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    first_name            = p_first_name,
    last_name             = p_last_name,
    phone                 = p_phone,
    default_address       = p_default_address,
    default_address_notes = p_default_address_notes,
    updated_at            = now()
  WHERE id = v_caller_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (private.get_current_user_role() = 'admin');

ALTER TABLE public.walking_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON public.walking_services FOR SELECT
  USING (is_active = TRUE);

-- EXPLICIT PRIVILEGE REVOCATION
-- Strip all default privileges, then grant back only what is needed.
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.walking_services FROM anon, authenticated;

-- Authenticated users: SELECT on profiles (own profile via RLS, or admin via RLS)
GRANT SELECT ON public.profiles TO authenticated;

-- Walking services: readable by anyone (authenticated or anonymous)
GRANT SELECT ON public.walking_services TO authenticated;
GRANT SELECT ON public.walking_services TO anon;

-- NOTE: No INSERT, UPDATE, or DELETE is granted on profiles.
-- Customer profile modification goes exclusively through
-- public.update_own_profile() (SECURITY DEFINER RPC).
-- Admin profile management will use a dedicated admin RPC in a later phase.

COMMIT;

