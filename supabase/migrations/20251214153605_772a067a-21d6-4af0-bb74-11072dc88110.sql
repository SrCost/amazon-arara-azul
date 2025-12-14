-- Criar tabela email_logs para rastreamento de envios
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_email_logs_reservation_id ON email_logs(reservation_id);
CREATE INDEX idx_email_logs_email_type_status ON email_logs(email_type, status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Super admins podem visualizar logs
CREATE POLICY "Super admins can view email logs"
  ON email_logs FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Service role pode inserir logs
CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (is_service_role());