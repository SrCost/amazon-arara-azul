-- Adiciona constraint para garantir que check_out > check_in
ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_checkout_after_checkin 
CHECK (check_out > check_in);