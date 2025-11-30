-- 1. Fix contact_messages: Restrict SELECT to admin/super_admin only (not regular users)
DROP POLICY IF EXISTS "users_select_messages" ON public.contact_messages;

CREATE POLICY "admins_select_messages" ON public.contact_messages
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2. Fix reservations_public_summary: Enable RLS on the view
-- First, we need to alter the view to use security_invoker
ALTER VIEW public.reservations_public_summary SET (security_invoker = true);

-- Since it's a view with masked data intended for public availability checks,
-- we'll create a function to safely access it for unauthenticated users
-- but only for checking availability (not exposing sensitive data)

-- 3. Remove CPF from payments user policy - users should only see limited payment info
-- The existing policy is fine for admins, but we need to ensure users don't see sensitive fields
-- We'll create a view for user-facing payment data without sensitive fields

CREATE OR REPLACE VIEW public.payments_user_view AS
SELECT 
  id,
  reservation_id,
  amount,
  status,
  payment_method,
  created_at
FROM public.payments;

-- Enable RLS on the view
ALTER VIEW public.payments_user_view SET (security_invoker = true);

-- 4. Update get_current_user_email to be more secure with additional checks
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return NULL (not 'system')
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the email for the authenticated user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  RETURN user_email;
END;
$$;

-- 5. Update payments user policy to be more restrictive
DROP POLICY IF EXISTS "users_select_own_payments" ON public.payments;

CREATE POLICY "users_select_own_payments" ON public.payments
FOR SELECT USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR
  -- Users can only see their own payments when authenticated
  (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = payments.reservation_id
      AND (
        r.user_id = auth.uid() OR 
        r.guest_email = get_current_user_email()
      )
    )
  )
);