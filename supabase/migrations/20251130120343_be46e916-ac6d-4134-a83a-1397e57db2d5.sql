-- Drop the problematic policy on payments
DROP POLICY IF EXISTS "users_select_own_payments" ON public.payments;

-- Recreate with proper function usage
CREATE POLICY "users_select_own_payments" ON public.payments
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.id = payments.reservation_id
      AND (reservations.user_id = auth.uid() OR reservations.guest_email = get_current_user_email())
  )) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);