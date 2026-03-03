CREATE OR REPLACE FUNCTION public.submit_checkout(
  p_reservation_id uuid, p_rating integer, p_comment text, p_issues text, p_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO booking_checkouts (reservation_id, rating, comment, issues)
  VALUES (p_reservation_id, p_rating, p_comment, p_issues);

  UPDATE reservations 
  SET checkout_completed = true, 
      status = 'finished',
      updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$$;