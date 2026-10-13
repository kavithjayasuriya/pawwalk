-- ============================================================
-- PAWWALK V1 — PHASE 2: BOOKING SYSTEM
-- ============================================================
-- Run this migration manually in the Supabase SQL Editor.
-- Requires: 001_phase0_foundation.sql and 002_dog_profiles.sql
-- ============================================================

BEGIN;

-- ============================================================
-- EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- ENUM
-- ============================================================
CREATE TYPE public.booking_status AS ENUM (
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);

-- ============================================================
-- ADD PRICE COLUMN TO WALKING SERVICES
-- ============================================================
ALTER TABLE public.walking_services
  ADD COLUMN base_price_cents INTEGER NOT NULL DEFAULT 0
  CONSTRAINT non_negative_price CHECK (base_price_cents >= 0);

UPDATE public.walking_services SET base_price_cents = 3000 WHERE name = '30-Minute Walk';
UPDATE public.walking_services SET base_price_cents = 4500 WHERE name = '60-Minute Walk';

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE public.bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key       UUID NOT NULL,
  customer_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  walker_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id            UUID NOT NULL REFERENCES public.walking_services(id) ON DELETE RESTRICT,
  status                public.booking_status NOT NULL DEFAULT 'confirmed',
  starts_at             TIMESTAMPTZ NOT NULL,
  ends_at               TIMESTAMPTZ NOT NULL,
  pickup_address        TEXT NOT NULL,
  pickup_notes          TEXT,
  base_price_cents      INTEGER NOT NULL,
  second_dog_fee_cents  INTEGER NOT NULL DEFAULT 0,
  total_price_cents     INTEGER NOT NULL,
  cancellation_reason   TEXT,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (ends_at > starts_at),

  CONSTRAINT non_negative_base_price CHECK (base_price_cents >= 0),
  CONSTRAINT non_negative_second_dog CHECK (second_dog_fee_cents >= 0),
  CONSTRAINT non_negative_total_price CHECK (total_price_cents >= 0),
  CONSTRAINT price_sum_consistent CHECK (
    total_price_cents = base_price_cents + second_dog_fee_cents
  ),

  CONSTRAINT no_walker_overlap EXCLUDE USING gist (
    walker_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status <> 'cancelled')
);

CREATE INDEX idx_bookings_starts_at ON public.bookings (starts_at);
CREATE INDEX idx_bookings_customer  ON public.bookings (customer_id, starts_at);
CREATE INDEX idx_bookings_walker    ON public.bookings (walker_id, starts_at);
CREATE INDEX idx_bookings_status    ON public.bookings (status);

CREATE UNIQUE INDEX idx_bookings_idempotency
  ON public.bookings (customer_id, idempotency_key);

-- ============================================================
-- BOOKING DOGS JUNCTION TABLE
-- ============================================================
CREATE TABLE public.booking_dogs (
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  dog_id     UUID NOT NULL REFERENCES public.dogs(id) ON DELETE RESTRICT,
  PRIMARY KEY (booking_id, dog_id)
);

-- ============================================================
-- RPC 1: GET AVAILABLE SLOTS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_service_id UUID,
  p_date       DATE
)
RETURNS TABLE (
  slot_start   TIME,
  slot_end     TIME,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_duration     INTEGER;
  v_melb_start   TIMESTAMP;
  v_melb_end     TIMESTAMP;
  v_walker_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Date is required';
  END IF;

  SELECT ws.duration_minutes INTO v_duration
  FROM public.walking_services ws
  WHERE ws.id = p_service_id AND ws.is_active = TRUE;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  v_melb_start := p_date::timestamp + TIME '08:00';
  v_melb_end   := p_date::timestamp + TIME '18:00';

  SELECT COUNT(*) INTO v_walker_count
  FROM public.profiles p
  WHERE p.accepts_walks = TRUE
    AND p.role IN ('walker', 'admin');

  RETURN QUERY
  SELECT
    slot_row.melb_start::TIME   AS slot_start,
    slot_row.melb_end::TIME     AS slot_end,
    (busy.cnt < v_walker_count) AS is_available
  FROM generate_series(
    0,
    EXTRACT(EPOCH FROM (v_melb_end - v_melb_start)) / 60 - v_duration,
    30
  ) AS g
  CROSS JOIN LATERAL (
    SELECT
      (v_melb_start + (g * INTERVAL '1 minute'))::timestamp                          AS melb_start,
      (v_melb_start + (g * INTERVAL '1 minute') + (v_duration * INTERVAL '1 minute'))::timestamp AS melb_end
  ) slot_row
  CROSS JOIN LATERAL (
    SELECT COUNT(DISTINCT b.walker_id)::INTEGER AS cnt
    FROM public.bookings b
    WHERE b.status <> 'cancelled'
      AND EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.id = b.walker_id
          AND p2.accepts_walks = TRUE
          AND p2.role IN ('walker', 'admin')
      )
      AND tstzrange(b.starts_at, b.ends_at) &&
          tstzrange(
            slot_row.melb_start AT TIME ZONE 'Australia/Melbourne',
            slot_row.melb_end   AT TIME ZONE 'Australia/Melbourne'
          )
  ) busy
  WHERE (slot_row.melb_start AT TIME ZONE 'Australia/Melbourne') > now()
  ORDER BY slot_row.melb_start;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_slots(UUID, DATE) TO authenticated;

-- ============================================================
-- RPC 2: CREATE BOOKING
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_booking(
  p_service_id       UUID,
  p_dog_ids          UUID[],
  p_date             DATE,
  p_time             TIME,
  p_pickup_address   TEXT,
  p_pickup_notes     TEXT,
  p_idempotency_key  UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id        UUID;
  v_duration         INTEGER;
  v_service_name     TEXT;
  v_base_price       INTEGER;
  v_second_dog_fee   INTEGER;
  v_total_price      INTEGER;
  v_local_start      TIMESTAMP;
  v_local_end        TIMESTAMP;
  v_utc_start        TIMESTAMPTZ;
  v_utc_end          TIMESTAMPTZ;
  v_melb_day_utc     TIMESTAMPTZ;
  v_melb_next_utc    TIMESTAMPTZ;
  v_walker_id        UUID;
  v_booking_id       UUID;
  v_existing_id      UUID;
  v_dog_count        INTEGER;
  v_dog_ids_dedup    UUID[];
BEGIN
  -- Auth
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF private.get_current_user_role() IS DISTINCT FROM 'customer' THEN
    RAISE EXCEPTION 'Only customers can create bookings';
  END IF;

  -- Validate required inputs before acquiring advisory lock
  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Idempotency key is required';
  END IF;
  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Booking date is required';
  END IF;
  IF p_time IS NULL THEN
    RAISE EXCEPTION 'Booking time is required';
  END IF;
  IF p_pickup_address IS NULL OR trim(p_pickup_address) = '' THEN
    RAISE EXCEPTION 'Pickup address is required';
  END IF;

  -- Idempotency: serialize on (caller, key)
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_caller_id::TEXT),
    pg_catalog.hashtext(p_idempotency_key::TEXT)
  );

  SELECT id INTO v_existing_id
  FROM public.bookings
  WHERE customer_id = v_caller_id
    AND idempotency_key = p_idempotency_key;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Validate service
  SELECT ws.duration_minutes, ws.name, ws.base_price_cents
  INTO v_duration, v_service_name, v_base_price
  FROM public.walking_services ws
  WHERE ws.id = p_service_id AND ws.is_active = TRUE;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  -- Validate dogs: 1 or 2, unique, non-null, active, owned
  IF p_dog_ids IS NULL
     OR array_length(p_dog_ids, 1) < 1
     OR array_length(p_dog_ids, 1) > 2 THEN
    RAISE EXCEPTION 'Exactly 1 or 2 dogs are required';
  END IF;

  SELECT array_agg(DISTINCT d) INTO v_dog_ids_dedup
  FROM unnest(p_dog_ids) AS d
  WHERE d IS NOT NULL;

  IF v_dog_ids_dedup IS NULL
     OR array_length(v_dog_ids_dedup, 1) <> array_length(p_dog_ids, 1) THEN
    RAISE EXCEPTION 'Duplicate or null dog IDs are not allowed';
  END IF;

  -- Lock dogs in deterministic order (prevents deadlocks), validate
  SELECT COUNT(*) INTO v_dog_count
  FROM (
    SELECT d.id
    FROM public.dogs d
    WHERE d.id = ANY(p_dog_ids)
      AND d.customer_id = v_caller_id
      AND d.is_active = TRUE
    ORDER BY d.id
    FOR UPDATE OF d
  ) locked;

  IF v_dog_count <> array_length(p_dog_ids, 1) THEN
    RAISE EXCEPTION 'One or more dogs do not belong to you or are not active';
  END IF;

  -- Time rules (Melbourne-local timestamps, not TIME, to avoid midnight wrap)
  IF p_time < TIME '08:00' THEN
    RAISE EXCEPTION 'Bookings cannot start before 08:00';
  END IF;

  IF EXTRACT(MINUTE FROM p_time) NOT IN (0, 30)
     OR EXTRACT(SECOND FROM p_time) <> 0 THEN
    RAISE EXCEPTION 'Start time must align to a 30-minute boundary';
  END IF;

  v_local_start := p_date::timestamp + p_time;
  v_local_end   := v_local_start + (v_duration * INTERVAL '1 minute');

  IF v_local_start < p_date::timestamp + TIME '08:00' THEN
    RAISE EXCEPTION 'Bookings cannot start before 08:00';
  END IF;

  IF v_local_end > p_date::timestamp + TIME '18:00' THEN
    RAISE EXCEPTION 'Booking would extend past the 18:00 operating hours end';
  END IF;

  -- Convert Melbourne-local to UTC
  v_utc_start := v_local_start AT TIME ZONE 'Australia/Melbourne';
  v_utc_end   := v_utc_start + (v_duration * INTERVAL '1 minute');

  IF v_utc_start <= now() THEN
    RAISE EXCEPTION 'Cannot book a time that has already passed';
  END IF;

  -- Reject if any selected dog already has an overlapping non-cancelled booking
  IF EXISTS (
    SELECT 1
    FROM public.booking_dogs bd
    JOIN public.bookings b ON b.id = bd.booking_id
    WHERE bd.dog_id = ANY(p_dog_ids)
      AND b.status <> 'cancelled'
      AND tstzrange(b.starts_at, b.ends_at) &&
          tstzrange(v_utc_start, v_utc_end)
  ) THEN
    RAISE EXCEPTION 'One or more selected dogs already have a booking during this time';
  END IF;

  -- Melbourne day boundaries in UTC (for load balancing)
  v_melb_day_utc  := p_date::timestamp
    AT TIME ZONE 'Australia/Melbourne';
  v_melb_next_utc := (p_date + INTERVAL '1 day')::timestamp
    AT TIME ZONE 'Australia/Melbourne';

  -- Price snapshot
  v_second_dog_fee := CASE
    WHEN array_length(p_dog_ids, 1) = 2 THEN 1000 ELSE 0
  END;
  v_total_price := v_base_price + v_second_dog_fee;

  -- Select eligible walker (load-balanced, concurrency-safe)
  SELECT p.id INTO v_walker_id
  FROM public.profiles p
  WHERE p.accepts_walks = TRUE
    AND p.role IN ('walker', 'admin')
    AND p.id NOT IN (
      SELECT b.walker_id
      FROM public.bookings b
      WHERE b.status <> 'cancelled'
        AND tstzrange(b.starts_at, b.ends_at) &&
            tstzrange(v_utc_start, v_utc_end)
    )
  ORDER BY (
    SELECT COUNT(*)
    FROM public.bookings b2
    WHERE b2.walker_id = p.id
      AND b2.starts_at >= v_melb_day_utc
      AND b2.starts_at <  v_melb_next_utc
      AND b2.status <> 'cancelled'
  ) ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_walker_id IS NULL THEN
    RAISE EXCEPTION 'No walker available for this time slot. Please choose a different time.';
  END IF;

  -- Insert booking (exclusion constraint = final safety net)
  INSERT INTO public.bookings (
    idempotency_key, customer_id, walker_id, service_id,
    status, starts_at, ends_at, pickup_address, pickup_notes,
    base_price_cents, second_dog_fee_cents, total_price_cents
  ) VALUES (
    p_idempotency_key, v_caller_id, v_walker_id, p_service_id,
    'confirmed', v_utc_start, v_utc_end, p_pickup_address, p_pickup_notes,
    v_base_price, v_second_dog_fee, v_total_price
  )
  RETURNING id INTO v_booking_id;

  -- Link dogs
  INSERT INTO public.booking_dogs (booking_id, dog_id)
  SELECT v_booking_id, unnest(p_dog_ids);

  RETURN v_booking_id;

EXCEPTION
  WHEN unique_violation THEN
    SELECT id INTO v_existing_id
    FROM public.bookings
    WHERE customer_id = v_caller_id
      AND idempotency_key = p_idempotency_key;
    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
    RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_booking(UUID, UUID[], DATE, TIME, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, UUID[], DATE, TIME, TEXT, TEXT, UUID) TO authenticated;

-- ============================================================
-- RPC 3: CANCEL BOOKING
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_reason     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id   UUID;
  v_caller_role TEXT;
  v_booking     RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_caller_role := private.get_current_user_role();

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_caller_role = 'customer' THEN
    IF v_booking.customer_id <> v_caller_id THEN
      RAISE EXCEPTION 'Not authorised to cancel this booking';
    END IF;
    IF v_booking.status <> 'confirmed' THEN
      RAISE EXCEPTION 'Cannot cancel a booking with status %', v_booking.status;
    END IF;
    IF v_booking.starts_at <= now() THEN
      RAISE EXCEPTION 'Cannot cancel a booking that has already started';
    END IF;
  ELSIF v_caller_role = 'admin' THEN
    IF v_booking.status <> 'confirmed' THEN
      RAISE EXCEPTION 'Cannot cancel a booking with status %', v_booking.status;
    END IF;
  ELSE
    RAISE EXCEPTION 'Not authorised to cancel bookings';
  END IF;

  UPDATE public.bookings
  SET status              = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_at        = now(),
      updated_at          = now()
  WHERE id = p_booking_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_booking(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID, TEXT) TO authenticated;

-- ============================================================
-- RPC 4: UPDATE BOOKING STATUS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_booking_id UUID,
  p_new_status public.booking_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id   UUID;
  v_caller_role TEXT;
  v_booking     RECORD;
  v_allowed     BOOLEAN := FALSE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_caller_role := private.get_current_user_role();

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status = 'confirmed' AND p_new_status = 'in_progress' THEN
    IF v_caller_role = 'admin' THEN
      v_allowed := TRUE;
    ELSIF v_caller_role = 'walker'
          AND v_booking.walker_id = v_caller_id THEN
      v_allowed := TRUE;
    END IF;
  ELSIF v_booking.status = 'in_progress' AND p_new_status = 'completed' THEN
    IF v_caller_role = 'admin' THEN
      v_allowed := TRUE;
    ELSIF v_caller_role = 'walker'
          AND v_booking.walker_id = v_caller_id THEN
      v_allowed := TRUE;
    END IF;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Transition from % to % is not permitted for role %',
      v_booking.status, p_new_status, v_caller_role;
  END IF;

  UPDATE public.bookings
  SET status = p_new_status, updated_at = now()
  WHERE id = p_booking_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_booking_status(UUID, public.booking_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_booking_status(UUID, public.booking_status) TO authenticated;

-- ============================================================
-- RPC 5: REASSIGN BOOKING WALKER
-- ============================================================
CREATE OR REPLACE FUNCTION public.reassign_booking_walker(
  p_booking_id    UUID,
  p_new_walker_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  IF private.get_current_user_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can reassign walkers';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Can only reassign bookings with status confirmed, current status is %',
      v_booking.status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_new_walker_id
      AND accepts_walks = TRUE
      AND role IN ('walker', 'admin')
  ) THEN
    RAISE EXCEPTION 'Target is not an eligible walker';
  END IF;

  UPDATE public.bookings
  SET walker_id = p_new_walker_id, updated_at = now()
  WHERE id = p_booking_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reassign_booking_walker(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reassign_booking_walker(UUID, UUID) TO authenticated;

-- ============================================================
-- RPC 6: GET BOOKING DETAIL
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_booking_detail(p_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_caller_id   UUID;
  v_caller_role TEXT;
  v_booking     RECORD;
  v_result      JSON;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_caller_role := private.get_current_user_role();

  SELECT * INTO v_booking
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Authorize: customer (own), walker (assigned), admin
  -- Fail-closed: any role not explicitly listed is rejected
  IF v_caller_role = 'customer' THEN
    IF v_booking.customer_id <> v_caller_id THEN
      RAISE EXCEPTION 'Not authorised to view this booking';
    END IF;
  ELSIF v_caller_role = 'walker' THEN
    IF v_booking.walker_id <> v_caller_id THEN
      RAISE EXCEPTION 'Not authorised to view this booking';
    END IF;
  ELSIF v_caller_role = 'admin' THEN
    -- Admin: always permitted
    NULL;
  ELSE
    -- Unknown or NULL role: reject
    RAISE EXCEPTION 'Not authorised to view this booking';
  END IF;

  -- Build JSON result with customer and dog details
  SELECT json_build_object(
    'id',                  b.id,
    'status',              b.status,
    'starts_at',           b.starts_at,
    'ends_at',             b.ends_at,
    'pickup_address',      b.pickup_address,
    'pickup_notes',        b.pickup_notes,
    'base_price_cents',    b.base_price_cents,
    'second_dog_fee_cents', b.second_dog_fee_cents,
    'total_price_cents',   b.total_price_cents,
    'cancellation_reason', b.cancellation_reason,
    'cancelled_at',        b.cancelled_at,
    'created_at',          b.created_at,
    'customer', json_build_object(
      'first_name', cp.first_name,
      'last_name',  cp.last_name,
      'phone',      cp.phone
    ),
    'walker', json_build_object(
      'first_name', wp.first_name,
      'last_name',  wp.last_name
    ),
    'service', json_build_object(
      'name',             ws.name,
      'duration_minutes', ws.duration_minutes
    ),
    'dogs', (
      SELECT json_agg(json_build_object(
        'id',                        d.id,
        'name',                      d.name,
        'breed',                     d.breed,
        'size',                      d.size,
        'temperament',               d.temperament,
        'walking_behavior_notes',    d.walking_behavior_notes,
        'lead_harness_instructions', d.lead_harness_instructions,
        'emergency_contact_name',    d.emergency_contact_name,
        'emergency_contact_phone',   d.emergency_contact_phone
      ))
      FROM public.booking_dogs bd
      JOIN public.dogs d ON d.id = bd.dog_id
      WHERE bd.booking_id = b.id
    )
  ) INTO v_result
  FROM public.bookings b
  JOIN public.profiles cp ON cp.id = b.customer_id
  JOIN public.profiles wp ON wp.id = b.walker_id
  JOIN public.walking_services ws ON ws.id = b.service_id
  WHERE b.id = p_booking_id;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booking_detail(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking_detail(UUID) TO authenticated;

-- ============================================================
-- RPC 7: GET WALKER SCHEDULE
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_walker_schedule(p_date DATE)
RETURNS TABLE (
  booking_id     UUID,
  status         public.booking_status,
  starts_at      TIMESTAMPTZ,
  ends_at        TIMESTAMPTZ,
  pickup_address TEXT,
  pickup_notes   TEXT,
  customer_name  TEXT,
  customer_phone TEXT,
  dog_names      TEXT[],
  service_name   TEXT,
  duration_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_caller_id   UUID;
  v_caller_role TEXT;
  v_melb_start  TIMESTAMPTZ;
  v_melb_end    TIMESTAMPTZ;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_caller_role := private.get_current_user_role();
  IF v_caller_role IS DISTINCT FROM 'walker'
     AND v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Not authorised to view walker schedules';
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Date is required';
  END IF;

  v_melb_start := p_date::timestamp AT TIME ZONE 'Australia/Melbourne';
  v_melb_end   := (p_date + INTERVAL '1 day')::timestamp
    AT TIME ZONE 'Australia/Melbourne';

  RETURN QUERY
  SELECT
    b.id                AS booking_id,
    b.status,
    b.starts_at,
    b.ends_at,
    b.pickup_address,
    b.pickup_notes,
    (cp.first_name || ' ' || cp.last_name) AS customer_name,
    cp.phone            AS customer_phone,
    ARRAY(
      SELECT d.name
      FROM public.booking_dogs bd
      JOIN public.dogs d ON d.id = bd.dog_id
      WHERE bd.booking_id = b.id
      ORDER BY d.name
    )                   AS dog_names,
    ws.name             AS service_name,
    ws.duration_minutes
  FROM public.bookings b
  JOIN public.profiles cp ON cp.id = b.customer_id
  JOIN public.walking_services ws ON ws.id = b.service_id
  WHERE b.walker_id = v_caller_id
    AND b.starts_at >= v_melb_start
    AND b.starts_at <  v_melb_end
    AND b.status <> 'cancelled'
  ORDER BY b.starts_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_walker_schedule(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_walker_schedule(DATE) TO authenticated;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Bookings: SELECT only (mutations via RPCs)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own bookings"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Walkers can view assigned bookings"
  ON public.bookings FOR SELECT
  USING (
    walker_id = auth.uid()
    AND private.get_current_user_role() IN ('walker', 'admin')
  );

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (private.get_current_user_role() = 'admin');

-- Booking dogs: SELECT only
ALTER TABLE public.booking_dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View booking dogs for authorised users"
  ON public.booking_dogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_dogs.booking_id
        AND (
          b.customer_id = auth.uid()
          OR (
            b.walker_id = auth.uid()
            AND private.get_current_user_role() IN ('walker', 'admin')
          )
          OR private.get_current_user_role() = 'admin'
        )
    )
  );

-- ============================================================
-- EXPLICIT GRANTS
-- ============================================================
REVOKE ALL ON public.bookings FROM anon, authenticated;
REVOKE ALL ON public.booking_dogs FROM anon, authenticated;

GRANT SELECT ON public.bookings TO authenticated;
GRANT SELECT ON public.booking_dogs TO authenticated;

-- ============================================================
-- FOUNDER BOOTSTRAP
-- ============================================================
-- After running this migration, promote the two founder accounts.
-- Find their UUIDs in Supabase Dashboard -> Authentication -> Users.
-- Then run:
--
-- UPDATE public.profiles
-- SET role = 'admin', accepts_walks = TRUE, updated_at = now()
-- WHERE id = '<founder-1-uuid>';
--
-- UPDATE public.profiles
-- SET role = 'admin', accepts_walks = TRUE, updated_at = now()
-- WHERE id = '<founder-2-uuid>';

COMMIT;