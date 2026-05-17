-- Track email delivery events from Resend webhook
ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS last_event text,
  ADD COLUMN IF NOT EXISTS last_event_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz,
  ADD COLUMN IF NOT EXISTS complained_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON public.email_logs(resend_id);

-- Allow service role to update logs (webhook updates delivery status)
DROP POLICY IF EXISTS "Service role can update email logs" ON public.email_logs;
CREATE POLICY "Service role can update email logs"
ON public.email_logs FOR UPDATE
USING (is_service_role())
WITH CHECK (is_service_role());