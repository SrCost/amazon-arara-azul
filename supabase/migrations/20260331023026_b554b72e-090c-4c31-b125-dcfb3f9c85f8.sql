
-- Add FNRH fields to booking_checkins
ALTER TABLE public.booking_checkins
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS city_state text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS transport_mode text,
  ADD COLUMN IF NOT EXISTS travel_reason text;

-- Update submit_checkin function with new FNRH parameters
CREATE OR REPLACE FUNCTION public.submit_checkin(
  p_reservation_id uuid,
  p_document text,
  p_estimated_arrival text,
  p_notes text,
  p_accepted_terms boolean,
  p_token text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_nationality text DEFAULT NULL,
  p_city_state text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_transport_mode text DEFAULT NULL,
  p_travel_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO booking_checkins (
    reservation_id, document, estimated_arrival_time, notes, accepted_terms,
    full_name, birth_date, nationality, city_state, address, transport_mode, travel_reason
  )
  VALUES (
    p_reservation_id, p_document, p_estimated_arrival, p_notes, p_accepted_terms,
    p_full_name, p_birth_date, p_nationality, p_city_state, p_address, p_transport_mode, p_travel_reason
  );

  UPDATE reservations SET checkin_completed = true, updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$$;
