CREATE OR REPLACE FUNCTION public.get_room_availability(p_room_id uuid)
 RETURNS TABLE(check_in date, check_out date, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT r.check_in, r.check_out, r.status
  FROM reservations r
  WHERE r.status IN ('pending', 'confirmed')
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE
    AND (
      r.room_id = p_room_id
      OR EXISTS (
        SELECT 1 FROM reservation_rooms rr
        WHERE rr.reservation_id = r.id AND rr.room_id = p_room_id
      )
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_room_availability_with_blocks(p_room_id uuid)
 RETURNS TABLE(check_in date, check_out date, status text, block_type text, is_blocked boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT r.check_in, r.check_out, r.status, NULL::text as block_type, false as is_blocked
  FROM reservations r
  WHERE r.status IN ('pending', 'confirmed')
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE
    AND (
      r.room_id = p_room_id
      OR EXISTS (
        SELECT 1 FROM reservation_rooms rr
        WHERE rr.reservation_id = r.id AND rr.room_id = p_room_id
      )
    )
  UNION ALL
  SELECT b.start_date as check_in, b.end_date as check_out, 'blocked'::text as status, b.block_type, true as is_blocked
  FROM blocked_dates b
  WHERE b.room_id = p_room_id
    AND b.end_date >= CURRENT_DATE;
END;
$function$;