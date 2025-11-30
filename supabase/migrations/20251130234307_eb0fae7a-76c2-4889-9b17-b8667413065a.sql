-- FASE 2 - PARTE A: Ajustes no Banco de Dados

-- 1. Adicionar campos faltantes na tabela payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS status_detail text,
ADD COLUMN IF NOT EXISTS total_amount numeric,
ADD COLUMN IF NOT EXISTS paid_amount numeric,
ADD COLUMN IF NOT EXISTS transaction_id text;

-- Criar índice para buscas por transaction_id
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON public.payments(reservation_id);

-- 2. Garantir que reservations tem os campos necessários (já existem, mas vamos confirmar)
-- package_id já existe como uuid

-- 3. RLS para permitir INSERT anônimo em reservations (já existe policy allow_anonymous_reservation_insert)
-- Vamos criar políticas mais específicas para payments

-- Drop existing policies para payments que possam conflitar
DROP POLICY IF EXISTS "public_insert_payments" ON public.payments;

-- Permitir INSERT em payments para qualquer um (será controlado pela Edge Function)
CREATE POLICY "public_insert_payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (true);

-- FASE 2 - PARTE D: Trigger para sincronizar payment status
-- Primeiro, criar a função se não existir ou atualizar
CREATE OR REPLACE FUNCTION public.sync_payment_to_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mapear status do pagamento para status da reserva
  UPDATE public.reservations
  SET 
    payment_status = CASE 
      WHEN NEW.status IN ('approved', 'aprovado') THEN 'pago'
      WHEN NEW.status IN ('rejected', 'rejeitado') THEN 'pagamento_rejeitado'
      WHEN NEW.status IN ('pending', 'pendente', 'in_process', 'em_processo') THEN 'pendente'
      WHEN NEW.status = 'refunded' THEN 'refunded'
      ELSE 'pendente'
    END,
    updated_at = NOW()
  WHERE id = NEW.reservation_id;
  
  RETURN NEW;
END;
$$;

-- Dropar trigger existente se houver
DROP TRIGGER IF EXISTS tg_sync_payment_to_reservation ON public.payments;

-- Criar trigger
CREATE TRIGGER tg_sync_payment_to_reservation
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_payment_to_reservation();

-- Garantir que payment_logs permite INSERT público (para logging)
DROP POLICY IF EXISTS "public_insert_payment_logs" ON public.payment_logs;
CREATE POLICY "public_insert_payment_logs" 
ON public.payment_logs 
FOR INSERT 
WITH CHECK (true);