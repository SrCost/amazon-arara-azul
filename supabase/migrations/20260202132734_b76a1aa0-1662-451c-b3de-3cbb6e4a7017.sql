-- Fix: Alterar FK payment_logs_payment_id_fkey para ON DELETE SET NULL
-- Isso permite excluir reservas sem erro de FK, preservando logs de auditoria

-- Remover constraint antiga do payment_id
ALTER TABLE public.payment_logs 
DROP CONSTRAINT IF EXISTS payment_logs_payment_id_fkey;

-- Adicionar constraint com ON DELETE SET NULL
ALTER TABLE public.payment_logs 
ADD CONSTRAINT payment_logs_payment_id_fkey 
FOREIGN KEY (payment_id) 
REFERENCES public.payments(id) 
ON DELETE SET NULL;