-- Fix RLS policies for users to view their own reservations
-- Also ensure admins can view all reservations

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "users_select_own_reservations" ON public.reservations;

-- Create comprehensive policy for users to view their own reservations
CREATE POLICY "users_select_own_reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  -- User can see their own reservations (by user_id)
  auth.uid() = user_id
  OR
  -- User can see reservations made with their email (for non-logged reservations)
  guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- Admins and super_admins can see all reservations
  has_role(auth.uid(), 'admin'::app_role)
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Ensure the allow_anonymous_reservation_insert policy exists and is correct
DROP POLICY IF EXISTS "allow_anonymous_reservation_insert" ON public.reservations;

CREATE POLICY "allow_anonymous_reservation_insert"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Update payments RLS to allow users to see their own payments
DROP POLICY IF EXISTS "users_select_own_payments" ON public.payments;

CREATE POLICY "users_select_own_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM reservations
    WHERE reservations.id = payments.reservation_id
    AND (
      reservations.user_id = auth.uid()
      OR
      reservations.guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  OR
  has_role(auth.uid(), 'admin'::app_role)
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Ensure contact_messages are visible to all authenticated users
DROP POLICY IF EXISTS "users_select_messages" ON public.contact_messages;

CREATE POLICY "users_select_messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role)
  OR
  has_role(auth.uid(), 'admin'::app_role)
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
);