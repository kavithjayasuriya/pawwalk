-- ============================================================
-- PAWWALK V1 — PHASE 1: DOG PROFILES
-- ============================================================
-- Run this migration manually in the Supabase SQL Editor.
-- Do NOT run this automatically via CLI or API.
-- Requires: 001_phase0_foundation.sql already applied.
-- ============================================================

BEGIN;

-- ============================================================
-- DOGS TABLE
-- ============================================================
CREATE TABLE public.dogs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  breed                     TEXT,
  age_range                 TEXT CHECK (age_range IN ('puppy', 'young', 'adult', 'senior')),
  size                      TEXT CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  temperament               TEXT,
  walking_behavior_notes    TEXT,
  lead_harness_instructions TEXT,
  emergency_contact_name    TEXT,
  emergency_contact_phone   TEXT,
  photo_path                TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dogs_customer ON public.dogs (customer_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

-- Customers: full CRUD on their own dogs only
CREATE POLICY "Customers can view own dogs"
  ON public.dogs FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert own dogs"
  ON public.dogs FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own dogs"
  ON public.dogs FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete own dogs"
  ON public.dogs FOR DELETE
  USING (customer_id = auth.uid());

-- Admins: read-only access to all dogs
CREATE POLICY "Admins can view all dogs"
  ON public.dogs FOR SELECT
  USING (private.get_current_user_role() = 'admin');

-- ============================================================
-- EXPLICIT PRIVILEGE REVOCATION
-- ============================================================
REVOKE ALL ON public.dogs FROM anon, authenticated;

-- Authenticated users: SELECT, INSERT, UPDATE, DELETE
-- (further scoped by RLS to own dogs only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dogs TO authenticated;

-- Anon: no access to dog profiles
-- (walking_services remains readable by anon per Phase 0)

COMMIT;