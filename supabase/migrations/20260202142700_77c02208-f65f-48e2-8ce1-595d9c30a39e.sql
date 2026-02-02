-- Atualizar constraint de status para incluir todos os status operacionais
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status = ANY (ARRAY[
  'pending',
  'confirmed', 
  'cancelled',
  'completed',
  'hosted',
  'finished',
  'no-show'
]));

-- Atualizar constraint de payment_status para consistência
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status = ANY (ARRAY[
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled'
]));