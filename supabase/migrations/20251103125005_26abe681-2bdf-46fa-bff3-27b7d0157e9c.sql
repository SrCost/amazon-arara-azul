-- Create activity_log table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'user', 'reservation', 'payment', 'message'
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view activity logs
CREATE POLICY "Super admins can view all activity logs"
ON public.activity_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can insert logs (no user restriction, logs are system-generated)
CREATE POLICY "System can insert activity logs"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- Function to automatically delete logs older than 15 days
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.activity_log 
  WHERE created_at < NOW() - INTERVAL '15 days';
END;
$$;

-- Trigger function to sync payment status with reservations
CREATE OR REPLACE FUNCTION public.sync_payment_status_to_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation_status TEXT;
BEGIN
  -- Map payment status to reservation payment_status
  CASE NEW.status
    WHEN 'completed' THEN reservation_status := 'completed';
    WHEN 'pending' THEN reservation_status := 'pending';
    WHEN 'failed' THEN reservation_status := 'failed';
    WHEN 'refunded' THEN reservation_status := 'pending';
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
$$;

-- Create trigger on payments table
DROP TRIGGER IF EXISTS sync_payment_to_reservation ON public.payments;
CREATE TRIGGER sync_payment_to_reservation
AFTER INSERT OR UPDATE OF status, payment_method ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_payment_status_to_reservation();

COMMENT ON TABLE public.activity_log IS 'Audit trail for administrative actions. Logs are automatically cleaned after 15 days.';
COMMENT ON FUNCTION public.cleanup_old_activity_logs() IS 'Deletes activity logs older than 15 days. Should be scheduled via cron.';
COMMENT ON FUNCTION public.sync_payment_status_to_reservation() IS 'Automatically syncs payment status changes to the reservations table.';