-- Drop the problematic policy
DROP POLICY IF EXISTS "users_select_own_reservations_v2" ON public.reservations;

-- Recreate with proper function usage instead of direct auth.users access
CREATE POLICY "users_select_own_reservations_v2" ON public.reservations
FOR SELECT USING (
  (auth.uid() = user_id) OR 
  (guest_email = get_current_user_email()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);