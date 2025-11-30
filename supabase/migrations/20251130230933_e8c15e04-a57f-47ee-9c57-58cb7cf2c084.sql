-- Add new columns to payments table for Orders API
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS mp_order_id text,
ADD COLUMN IF NOT EXISTS method text;

-- Update method column from payment_method if exists
UPDATE public.payments SET method = payment_method WHERE method IS NULL AND payment_method IS NOT NULL;

-- Add payment_reference to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS payment_reference text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_mp_order_id ON public.payments(mp_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON public.payments(mercado_pago_payment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_reference ON public.reservations(payment_reference);