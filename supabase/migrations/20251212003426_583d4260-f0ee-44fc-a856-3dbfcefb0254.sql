
-- ============================================
-- SECURITY FIX: Consolidate and Restrict RLS Policies
-- ============================================

-- 1. Create is_service_role() function to validate Edge Function operations
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role',
    false
  )
$$;

-- ============================================
-- 2. FIX RESERVATIONS TABLE POLICIES
-- ============================================

-- Remove duplicate anonymous insert policy
DROP POLICY IF EXISTS "allow_anonymous_reservation_insert" ON public.reservations;

-- Remove old authenticated users policy (will be replaced)
DROP POLICY IF EXISTS "authenticated_users_insert_reservations" ON public.reservations;

-- Remove old edge policy
DROP POLICY IF EXISTS "insert_edge_reservations" ON public.reservations;

-- Create single secure insert policy for Edge Functions and authenticated users
CREATE POLICY "secure_insert_reservations"
ON public.reservations FOR INSERT
WITH CHECK (
  is_service_role() OR 
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
);

-- ============================================
-- 3. FIX PAYMENT_LOGS TABLE POLICIES
-- ============================================

-- Remove duplicate insert policies
DROP POLICY IF EXISTS "public_insert_payment_logs" ON public.payment_logs;
DROP POLICY IF EXISTS "System can insert payment logs" ON public.payment_logs;

-- Create single secure insert policy for service role only
CREATE POLICY "service_role_insert_payment_logs"
ON public.payment_logs FOR INSERT
WITH CHECK (is_service_role());

-- ============================================
-- 4. FIX PAYMENTS TABLE POLICIES (CRITICAL)
-- ============================================

-- Remove dangerous open policies
DROP POLICY IF EXISTS "public_insert_payments" ON public.payments;
DROP POLICY IF EXISTS "insert_edge_payments" ON public.payments;
DROP POLICY IF EXISTS "update_edge_payments" ON public.payments;

-- Create secure policy for Edge Functions (service_role) to manage payments
CREATE POLICY "service_role_manage_payments"
ON public.payments FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- ============================================
-- 5. Add comment for documentation
-- ============================================
COMMENT ON FUNCTION public.is_service_role() IS 
'Security function to verify if current operation is from service_role (Edge Functions). Used in RLS policies to restrict sensitive operations.';
