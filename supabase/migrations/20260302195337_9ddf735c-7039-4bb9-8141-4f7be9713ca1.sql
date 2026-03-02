
-- 1. Google Reviews Cache
CREATE TABLE public.google_reviews_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL,
  profile_photo_url text,
  review_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.google_reviews_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.google_reviews_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role manages reviews" ON public.google_reviews_cache
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

-- 2. Booking Checkins
CREATE TABLE public.booking_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  document text NOT NULL,
  estimated_arrival_time text,
  notes text,
  accepted_terms boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.booking_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role inserts checkins" ON public.booking_checkins
  FOR INSERT WITH CHECK (is_service_role());

CREATE POLICY "Admins view checkins" ON public.booking_checkins
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 3. Booking Checkouts
CREATE TABLE public.booking_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  issues text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.booking_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role inserts checkouts" ON public.booking_checkouts
  FOR INSERT WITH CHECK (is_service_role());

CREATE POLICY "Admins view checkouts" ON public.booking_checkouts
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 4. Booking Tokens
CREATE TABLE public.booking_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('checkin', 'checkout')),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '48 hours'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.booking_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages tokens" ON public.booking_tokens
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

CREATE POLICY "Admins view tokens" ON public.booking_tokens
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 5. Add optional columns to reservations
ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS checkin_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkout_completed boolean DEFAULT false;

-- 6. RPC: Validate reservation for checkin/checkout (no sensitive data exposed)
CREATE OR REPLACE FUNCTION public.validate_reservation_for_guest(
  p_reservation_id uuid,
  p_email text
)
RETURNS TABLE(
  id uuid,
  guest_name text,
  room_name text,
  check_in date,
  check_out date,
  guests integer,
  checkin_completed boolean,
  checkout_completed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.guest_name,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    COALESCE(r.checkin_completed, false),
    COALESCE(r.checkout_completed, false)
  FROM reservations r
  WHERE r.id = p_reservation_id
    AND lower(r.guest_email) = lower(p_email)
    AND r.status IN ('pending', 'confirmed');
END;
$$;

-- 7. RPC: Validate booking token
CREATE OR REPLACE FUNCTION public.validate_booking_token(
  p_token text,
  p_type text
)
RETURNS TABLE(
  reservation_id uuid,
  guest_name text,
  room_name text,
  check_in date,
  check_out date,
  guests integer,
  checkin_completed boolean,
  checkout_completed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.guest_name,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    COALESCE(r.checkin_completed, false),
    COALESCE(r.checkout_completed, false)
  FROM booking_tokens bt
  JOIN reservations r ON r.id = bt.reservation_id
  WHERE bt.token = p_token
    AND bt.type = p_type
    AND bt.used = false
    AND bt.expires_at > now()
    AND r.status IN ('pending', 'confirmed');
END;
$$;

-- 8. RPC: Submit checkin (service-like, marks token used)
CREATE OR REPLACE FUNCTION public.submit_checkin(
  p_reservation_id uuid,
  p_document text,
  p_estimated_arrival text,
  p_notes text,
  p_accepted_terms boolean,
  p_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO booking_checkins (reservation_id, document, estimated_arrival_time, notes, accepted_terms)
  VALUES (p_reservation_id, p_document, p_estimated_arrival, p_notes, p_accepted_terms);

  UPDATE reservations SET checkin_completed = true, updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$$;

-- 9. RPC: Submit checkout
CREATE OR REPLACE FUNCTION public.submit_checkout(
  p_reservation_id uuid,
  p_rating integer,
  p_comment text,
  p_issues text,
  p_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO booking_checkouts (reservation_id, rating, comment, issues)
  VALUES (p_reservation_id, p_rating, p_comment, p_issues);

  UPDATE reservations SET checkout_completed = true, updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$$;
