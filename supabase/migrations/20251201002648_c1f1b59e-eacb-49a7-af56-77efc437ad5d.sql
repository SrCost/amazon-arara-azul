-- Drop and recreate the sync_payment_to_reservation trigger function with correct English values
CREATE OR REPLACE FUNCTION public.sync_payment_to_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Map payment status to reservation payment_status using correct English values
  UPDATE public.reservations
  SET 
    payment_status = CASE 
      WHEN NEW.status IN ('approved', 'paid', 'completed') THEN 'paid'
      WHEN NEW.status IN ('rejected', 'cancelled', 'failed') THEN 'failed'
      WHEN NEW.status IN ('pending', 'in_process', 'authorized', 'processing') THEN 'pending'
      WHEN NEW.status = 'refunded' THEN 'refunded'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.reservation_id;
  
  RETURN NEW;
END;
$function$;

-- Also update the sync_payment_status_to_reservation function for consistency
CREATE OR REPLACE FUNCTION public.sync_payment_status_to_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reservation_status TEXT;
BEGIN
  -- Map payment status to reservation payment_status
  CASE NEW.status
    WHEN 'completed' THEN reservation_status := 'paid';
    WHEN 'approved' THEN reservation_status := 'paid';
    WHEN 'paid' THEN reservation_status := 'paid';
    WHEN 'pending' THEN reservation_status := 'pending';
    WHEN 'processing' THEN reservation_status := 'processing';
    WHEN 'in_process' THEN reservation_status := 'pending';
    WHEN 'authorized' THEN reservation_status := 'pending';
    WHEN 'failed' THEN reservation_status := 'failed';
    WHEN 'rejected' THEN reservation_status := 'failed';
    WHEN 'cancelled' THEN reservation_status := 'failed';
    WHEN 'refunded' THEN reservation_status := 'refunded';
    ELSE reservation_status := 'pending';
  END CASE;

  -- Update the corresponding reservation
  UPDATE public.reservations
  SET payment_status = reservation_status,
      payment_method = NEW.payment_method,
      updated_at = NOW()
  WHERE id = NEW.reservation_id;

  RETURN NEW;
END;
$function$;