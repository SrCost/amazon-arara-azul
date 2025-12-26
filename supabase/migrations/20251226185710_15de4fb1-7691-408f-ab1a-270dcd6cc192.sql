-- 1. Add accepted_terms and accepted_at columns to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- 2. Add is_test flag to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- 3. Mark all existing reservations as test
UPDATE public.reservations 
SET is_test = TRUE 
WHERE is_test IS NULL OR is_test = FALSE;

-- 4. Create index for is_test for performance
CREATE INDEX IF NOT EXISTS idx_reservations_is_test ON public.reservations(is_test);

-- 5. Update get_room_availability function to filter out test reservations
CREATE OR REPLACE FUNCTION public.get_room_availability(p_room_id uuid)
 RETURNS TABLE(check_in date, check_out date, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.check_in, r.check_out, r.status
  FROM reservations r
  WHERE r.room_id = p_room_id
    AND r.status IN ('pending', 'confirmed')
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE;
END;
$function$;

-- 6. Update get_public_reservation_summary to filter out test reservations
CREATE OR REPLACE FUNCTION public.get_public_reservation_summary(p_room_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(room_id uuid, check_in date, check_out date, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE;
END;
$function$;