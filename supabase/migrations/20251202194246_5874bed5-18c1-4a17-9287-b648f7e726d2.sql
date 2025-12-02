-- Drop the existing check constraint and recreate with 'failed' as a valid status
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));