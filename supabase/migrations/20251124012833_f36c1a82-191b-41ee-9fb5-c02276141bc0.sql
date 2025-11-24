-- Add payment fields to reservations table
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_qr_code TEXT,
ADD COLUMN IF NOT EXISTS payment_qr_code_base64 TEXT,
ADD COLUMN IF NOT EXISTS payment_ticket_url TEXT,
ADD COLUMN IF NOT EXISTS payer_name TEXT,
ADD COLUMN IF NOT EXISTS payer_email TEXT,
ADD COLUMN IF NOT EXISTS payer_cpf TEXT,
ADD COLUMN IF NOT EXISTS transaction_amount NUMERIC,
ADD COLUMN IF NOT EXISTS transaction_currency TEXT DEFAULT 'BRL';

-- Create payment_logs table for audit
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id),
  payment_id UUID REFERENCES public.payments(id),
  action TEXT NOT NULL,
  status TEXT,
  error_code TEXT,
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_logs
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow insert for payment_logs (system)
DROP POLICY IF EXISTS "System can insert payment logs" ON public.payment_logs;
CREATE POLICY "System can insert payment logs"
ON public.payment_logs
FOR INSERT
WITH CHECK (true);

-- RLS Policy: Super admins can view payment logs
DROP POLICY IF EXISTS "Super admins can view payment logs" ON public.payment_logs;
CREATE POLICY "Super admins can view payment logs"
ON public.payment_logs
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add unique constraint to prevent duplicate reservations
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reservation 
ON public.reservations(room_id, check_in, check_out, guest_email)
WHERE status != 'cancelled';

-- Add refund fields to payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payer_name TEXT,
ADD COLUMN IF NOT EXISTS payer_email TEXT,
ADD COLUMN IF NOT EXISTS payer_cpf TEXT;

-- Create trigger to update payments updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update sync trigger to handle new payment statuses
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
    WHEN 'completed' THEN reservation_status := 'paid';
    WHEN 'approved' THEN reservation_status := 'paid';
    WHEN 'pending' THEN reservation_status := 'pending';
    WHEN 'processing' THEN reservation_status := 'processing';
    WHEN 'failed' THEN reservation_status := 'failed';
    WHEN 'rejected' THEN reservation_status := 'failed';
    WHEN 'refunded' THEN reservation_status := 'refunded';
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