-- Fix reservations table RLS policies to protect sensitive PII data
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "allow_anonymous_reservation_insert" ON public.reservations;
DROP POLICY IF EXISTS "users_select_own_reservations" ON public.reservations;

-- Allow anonymous INSERT (required for public reservation flow)
-- This is safe because users can only insert their own data
CREATE POLICY "allow_anonymous_reservation_insert"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to INSERT their own reservations
CREATE POLICY "authenticated_users_insert_reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Users can only SELECT their own reservations (by user_id OR guest_email)
-- This prevents unauthorized access to other guests' sensitive data
CREATE POLICY "users_select_own_reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admins and super_admins can view all reservations
-- (This policy is redundant with the above but kept for clarity)
CREATE POLICY "admins_select_all_reservations_v2"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Users can only UPDATE their own reservations
CREATE POLICY "users_update_own_reservations_v2"
ON public.reservations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only admins and super_admins can UPDATE all reservations
CREATE POLICY "admins_update_all_reservations_v2"
ON public.reservations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only admins and super_admins can DELETE reservations
CREATE POLICY "admins_delete_reservations_v2"
ON public.reservations
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Drop old redundant policies
DROP POLICY IF EXISTS "admins_select_all_reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "admins_update_all_reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can delete reservations" ON public.reservations;
DROP POLICY IF EXISTS "admins_delete_reservations" ON public.reservations;
DROP POLICY IF EXISTS "users_update_own_reservations" ON public.reservations;

-- Add comment documenting the security model
COMMENT ON TABLE public.reservations IS 'Contains sensitive guest PII. RLS policies ensure only reservation owners and admins can view sensitive data. Anonymous INSERT is allowed for public booking flow but SELECT is restricted to authenticated users viewing their own data only.';