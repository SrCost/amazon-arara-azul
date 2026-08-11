ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quantidade_hospede_adulto integer,
  ADD COLUMN IF NOT EXISTS quantidade_hospede_menor integer,
  ADD COLUMN IF NOT EXISTS genero text,
  ADD COLUMN IF NOT EXISTS documento_tipo text,
  ADD COLUMN IF NOT EXISTS reserva_id_fnrh uuid,
  ADD COLUMN IF NOT EXISTS hospede_id_fnrh uuid,
  ADD COLUMN IF NOT EXISTS pessoa_id_fnrh uuid,
  ADD COLUMN IF NOT EXISTS situacao_fnrh text,
  ADD COLUMN IF NOT EXISTS link_precheckin text,
  ADD COLUMN IF NOT EXISTS erro_sincronizacao_fnrh text,
  ADD COLUMN IF NOT EXISTS fnrh_checkin_em timestamptz,
  ADD COLUMN IF NOT EXISTS fnrh_checkout_em timestamptz;

COMMENT ON COLUMN public.reservations.documento_tipo IS 'CPF ou PASSAPORTE (exigido pela FNRH)';
COMMENT ON COLUMN public.reservations.situacao_fnrh IS 'PRECHECKIN_PENDENTE, PRECHECKIN_REALIZADO, CHECKIN_REALIZADO, CHECKOUT_REALIZADO, NOSHOW, CANCELADO, ERRO_SINCRONIZACAO';