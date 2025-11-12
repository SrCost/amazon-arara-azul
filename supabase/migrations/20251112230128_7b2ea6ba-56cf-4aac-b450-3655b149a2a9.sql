-- FASE 2: Ajustar RLS para permitir reservas públicas e habilitar Realtime

-- Drop existing INSERT policy that requires authentication
DROP POLICY IF EXISTS "Users can create their own reservations" ON public.reservations;

-- Create new policy that allows public INSERT with proper validation
-- Anyone can create a reservation, but if user_id is provided, it must match auth.uid()
CREATE POLICY "Anyone can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (
  -- Allow if no user_id (public booking)
  (user_id IS NULL)
  OR
  -- Or if user_id matches authenticated user
  (user_id = auth.uid())
);

-- Ensure users can view their own reservations (keep existing policy)
-- This policy already exists, just ensuring it's correct
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
CREATE POLICY "Users can view their own reservations"
ON public.reservations
FOR SELECT
USING (
  -- Admins can see all
  (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  ))
  OR
  -- Users can see their own reservations
  (auth.uid() = user_id)
  OR
  -- Allow viewing reservations by email for non-authenticated users (for confirmation lookup)
  (user_id IS NULL AND guest_email = get_current_user_email())
);

-- Enable Realtime for reservations table so admin dashboard updates automatically
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

-- Also enable realtime for payments table for complete dashboard sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Add helpful comment
COMMENT ON POLICY "Anyone can create reservations" ON public.reservations IS 
'Allows both authenticated users and public guests to create reservations. If user_id is provided, it must match the authenticated user.';