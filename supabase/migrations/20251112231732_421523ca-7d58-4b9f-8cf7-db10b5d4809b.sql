-- FASE 5: Audit logging and RLS policies for payments table

-- Add audit logging triggers for payments table
DROP TRIGGER IF EXISTS trg_audit_payments_insert ON public.payments;
DROP TRIGGER IF EXISTS trg_audit_payments_update ON public.payments;
DROP TRIGGER IF EXISTS trg_audit_payments_delete ON public.payments;

CREATE TRIGGER trg_audit_payments_insert
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_payments_update
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_payments_delete
AFTER DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

-- Ensure payment status sync trigger exists
DROP TRIGGER IF EXISTS trg_sync_payment_status ON public.payments;

CREATE TRIGGER trg_sync_payment_status
AFTER UPDATE OF status ON public.payments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_payment_status_to_reservation();

-- Add RLS policies for payments table (if not already present)
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;

-- Allow admins and super_admins to view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow only admins and super_admins to update payments
CREATE POLICY "Admins can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow only super_admins to delete payments
CREATE POLICY "Admins can delete payments"
ON public.payments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add comments for documentation
COMMENT ON TRIGGER trg_audit_payments_insert ON public.payments IS 
'Logs all INSERT operations on payments to audit_log';

COMMENT ON TRIGGER trg_audit_payments_update ON public.payments IS 
'Logs all UPDATE operations on payments to audit_log';

COMMENT ON TRIGGER trg_audit_payments_delete ON public.payments IS 
'Logs all DELETE operations on payments to audit_log';

COMMENT ON TRIGGER trg_sync_payment_status ON public.payments IS 
'Automatically syncs payment status changes to reservations table';

COMMENT ON POLICY "Admins can view all payments" ON public.payments IS 
'Allow admins and super_admins to view all payment records';

COMMENT ON POLICY "Admins can update payments" ON public.payments IS 
'Allow admins and super_admins to update payment records';

COMMENT ON POLICY "Admins can delete payments" ON public.payments IS 
'Allow only super_admins to delete payment records';