-- =====================================================
-- SECURITY FIX: Restrict sensitive data exposure
-- =====================================================

-- 1. Create secure function for token-based access (WITHOUT sensitive data)
CREATE OR REPLACE FUNCTION public.get_reservation_safe_with_token(_reservation_id uuid, _token text)
RETURNS TABLE(
  id uuid,
  room_name text,
  check_in date,
  check_out date,
  guests integer,
  status text,
  payment_status text,
  total_price numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate token
  IF NOT validate_reservation_token(_token, _reservation_id) THEN
    RAISE EXCEPTION 'Token inválido ou expirado';
  END IF;
  
  -- Return ONLY non-sensitive fields
  RETURN QUERY
  SELECT 
    r.id,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    r.status,
    r.payment_status,
    r.total_price,
    r.created_at
  FROM reservations r
  WHERE r.id = _reservation_id;
END;
$$;

-- 2. Remove the dangerous select_with_valid_token policy that exposed ALL reservation data
DROP POLICY IF EXISTS "select_with_valid_token" ON public.reservations;

-- 3. Create secure function to replace reservations_public_summary view
-- This function returns ONLY occupancy data (no guest information at all)
CREATE OR REPLACE FUNCTION public.get_public_reservation_summary(p_room_id uuid DEFAULT NULL)
RETURNS TABLE(
  room_id uuid,
  check_in date,
  check_out date,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.room_id,
    r.check_in,
    r.check_out,
    r.status
  FROM reservations r
  WHERE r.status IN ('pending', 'confirmed')
    AND (p_room_id IS NULL OR r.room_id = p_room_id)
    AND r.check_out >= CURRENT_DATE;
END;
$$;

-- 4. Add comment documenting security rationale
COMMENT ON FUNCTION public.get_reservation_safe_with_token IS 'Secure token-based reservation access. Returns only non-sensitive fields (no CPF, passport, email, phone, address, emergency contact, or payment details).';
COMMENT ON FUNCTION public.get_public_reservation_summary IS 'Public room occupancy data. Returns only room_id, dates, and status. No guest information exposed.';