-- =============================================
-- FASE 1: Calendário de Reservas PMS
-- =============================================

-- 1.1. Criar tabela de bloqueios de datas
CREATE TABLE public.blocked_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  block_type TEXT DEFAULT 'maintenance' CHECK (block_type IN ('maintenance', 'owner_use', 'exclusive', 'event', 'other')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 1.2. Criar enum para origem da reserva
DO $$ BEGIN
  CREATE TYPE reservation_source_type AS ENUM ('site', 'whatsapp', 'booking', 'airbnb', 'agency', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1.3. Adicionar novos campos na tabela reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS reservation_source TEXT DEFAULT 'site',
ADD COLUMN IF NOT EXISTS operational_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS operational_notes TEXT,
ADD COLUMN IF NOT EXISTS channel_reference_id TEXT,
ADD COLUMN IF NOT EXISTS daily_rate NUMERIC;

-- 1.4. Habilitar RLS na tabela blocked_dates
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- 1.5. Policies para blocked_dates
-- Admins podem gerenciar todos os bloqueios
CREATE POLICY "admins_manage_blocked_dates" ON public.blocked_dates
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Qualquer um pode visualizar bloqueios (para verificar disponibilidade pública)
CREATE POLICY "public_view_blocked_dates" ON public.blocked_dates
FOR SELECT USING (true);

-- 1.6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_blocked_dates_room_id ON public.blocked_dates(room_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date_range ON public.blocked_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_operational_status ON public.reservations(operational_status);
CREATE INDEX IF NOT EXISTS idx_reservations_source ON public.reservations(reservation_source);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in_out ON public.reservations(check_in, check_out);

-- 1.7. Trigger para updated_at em blocked_dates
CREATE TRIGGER update_blocked_dates_updated_at
BEFORE UPDATE ON public.blocked_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 1.8. Função atualizada para verificar disponibilidade incluindo bloqueios
CREATE OR REPLACE FUNCTION public.get_room_availability_with_blocks(p_room_id uuid)
RETURNS TABLE(
  check_in date, 
  check_out date, 
  status text,
  block_type text,
  is_blocked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Retorna reservas ativas
  RETURN QUERY
  SELECT r.check_in, r.check_out, r.status, NULL::text as block_type, false as is_blocked
  FROM reservations r
  WHERE r.room_id = p_room_id
    AND r.status IN ('pending', 'confirmed')
    AND r.check_out >= CURRENT_DATE
    AND COALESCE(r.is_test, FALSE) = FALSE
  UNION ALL
  -- Retorna bloqueios ativos
  SELECT b.start_date as check_in, b.end_date as check_out, 'blocked'::text as status, b.block_type, true as is_blocked
  FROM blocked_dates b
  WHERE b.room_id = p_room_id
    AND b.end_date >= CURRENT_DATE;
END;
$function$;

-- 1.9. Habilitar realtime para blocked_dates
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_dates;