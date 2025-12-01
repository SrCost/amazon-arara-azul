-- FASE 1: Adicionar colunas faltantes às tabelas existentes
-- (Não recriamos as tabelas para preservar dados existentes)

-- Adicionar colunas faltantes em reservations (se não existirem)
DO $$ 
BEGIN
  -- mp_order_id para reservations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'mp_order_id') THEN
    ALTER TABLE public.reservations ADD COLUMN mp_order_id text;
  END IF;
  
  -- mp_transaction_id para reservations  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'mp_transaction_id') THEN
    ALTER TABLE public.reservations ADD COLUMN mp_transaction_id text;
  END IF;
END $$;

-- Garantir que payments tem todas as colunas necessárias
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'mp_payment_id') THEN
    ALTER TABLE public.payments ADD COLUMN mp_payment_id text;
  END IF;
END $$;

-- Atualizar/criar políticas RLS para permitir insert via Edge Function
-- Política para reservations - insert público (edge function usa service_role)
DROP POLICY IF EXISTS "insert_edge_reservations" ON public.reservations;
CREATE POLICY "insert_edge_reservations" ON public.reservations 
  FOR INSERT WITH CHECK (true);

-- Política para payments - insert público (edge function usa service_role)
DROP POLICY IF EXISTS "insert_edge_payments" ON public.payments;
CREATE POLICY "insert_edge_payments" ON public.payments 
  FOR INSERT WITH CHECK (true);

-- Política para payments - update via edge function
DROP POLICY IF EXISTS "update_edge_payments" ON public.payments;
CREATE POLICY "update_edge_payments" ON public.payments 
  FOR UPDATE USING (true) WITH CHECK (true);