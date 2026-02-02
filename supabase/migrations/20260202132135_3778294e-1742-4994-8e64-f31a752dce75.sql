-- Remover constraint antiga
ALTER TABLE public.payment_logs 
DROP CONSTRAINT IF EXISTS payment_logs_reservation_id_fkey;

-- Adicionar constraint com ON DELETE SET NULL
ALTER TABLE public.payment_logs 
ADD CONSTRAINT payment_logs_reservation_id_fkey 
FOREIGN KEY (reservation_id) 
REFERENCES public.reservations(id) 
ON DELETE SET NULL;