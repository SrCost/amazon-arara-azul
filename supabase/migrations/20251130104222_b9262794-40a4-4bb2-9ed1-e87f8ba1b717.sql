-- Fix generate_reservation_token function to use correct pgcrypto path
CREATE OR REPLACE FUNCTION public.generate_reservation_token(_reservation_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _token text;
BEGIN
  -- Use full path to pgcrypto function in extensions schema
  _token := encode(extensions.gen_random_bytes(24), 'base64');
  _token := replace(replace(replace(_token, '+', ''), '/', ''), '=', '');
  
  INSERT INTO public.reservation_access_tokens (reservation_id, token)
  VALUES (_reservation_id, _token);
  
  RETURN _token;
END;
$function$;