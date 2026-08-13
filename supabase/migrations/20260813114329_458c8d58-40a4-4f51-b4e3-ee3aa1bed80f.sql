ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS pre_checkin_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_checkin_email_sent_at timestamptz;