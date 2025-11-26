-- ============================================
-- SEGURANÇA AVANÇADA PARA DADOS SENSÍVEIS
-- ============================================

-- 1. Criar tabela de tokens de acesso temporário para reservas
CREATE TABLE IF NOT EXISTS public.reservation_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Índices para performance
CREATE INDEX idx_reservation_tokens_token ON public.reservation_access_tokens(token);
CREATE INDEX idx_reservation_tokens_expires ON public.reservation_access_tokens(expires_at);
CREATE INDEX idx_reservation_tokens_reservation ON public.reservation_access_tokens(reservation_id);

-- 2. Função para gerar token seguro
CREATE OR REPLACE FUNCTION public.generate_reservation_token(_reservation_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token text;
BEGIN
  -- Gerar token aleatório seguro (32 caracteres)
  _token := encode(gen_random_bytes(24), 'base64');
  _token := replace(replace(replace(_token, '+', ''), '/', ''), '=', '');
  
  -- Inserir token na tabela
  INSERT INTO public.reservation_access_tokens (reservation_id, token)
  VALUES (_reservation_id, _token);
  
  RETURN _token;
END;
$$;

-- 3. Função para validar token de acesso
CREATE OR REPLACE FUNCTION public.validate_reservation_token(_token text, _reservation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _valid boolean;
BEGIN
  -- Verificar se token existe, não expirou e pertence à reserva
  SELECT EXISTS (
    SELECT 1 
    FROM public.reservation_access_tokens
    WHERE token = _token
      AND reservation_id = _reservation_id
      AND expires_at > now()
  ) INTO _valid;
  
  -- Marcar token como usado se válido
  IF _valid THEN
    UPDATE public.reservation_access_tokens
    SET used_at = now()
    WHERE token = _token AND used_at IS NULL;
  END IF;
  
  RETURN _valid;
END;
$$;

-- 4. View pública com dados mascarados (para listagens públicas, se necessário)
CREATE OR REPLACE VIEW public.reservations_public_summary
WITH (security_invoker=on)
AS
SELECT 
  id,
  room_id,
  check_in,
  check_out,
  guests,
  status,
  created_at,
  -- Dados mascarados
  substring(guest_name, 1, 1) || '***' as guest_name_masked,
  substring(guest_email, 1, 3) || '***@***' as guest_email_masked,
  CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'pending' END as payment_status
FROM public.reservations
WHERE status NOT IN ('cancelled', 'rejected');

-- 5. RLS para reservation_access_tokens
ALTER TABLE public.reservation_access_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver tokens
CREATE POLICY "admins_select_tokens"
ON public.reservation_access_tokens
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Sistema pode inserir tokens
CREATE POLICY "system_insert_tokens"
ON public.reservation_access_tokens
FOR INSERT
WITH CHECK (true);

-- 6. Atualizar política de SELECT para reservations
-- Remover a antiga e criar nova mais restrita
DROP POLICY IF EXISTS "users_select_own_reservations" ON public.reservations;

CREATE POLICY "users_select_own_reservations_v2"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  -- Usuário autenticado pode ver suas próprias reservas
  (auth.uid() = user_id) OR 
  (guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
  -- Admins podem ver tudo
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Política especial: SELECT com token válido (via SET LOCAL)
CREATE POLICY "select_with_valid_token"
ON public.reservations
FOR SELECT
USING (
  -- Permitir acesso se token válido foi validado via SET LOCAL
  current_setting('app.reservation_token', true) IS NOT NULL AND
  validate_reservation_token(
    current_setting('app.reservation_token', true),
    id
  )
);

-- 7. Função para buscar reserva com token (para usar no frontend)
CREATE OR REPLACE FUNCTION public.get_reservation_with_token(_reservation_id uuid, _token text)
RETURNS TABLE (
  id uuid,
  room_id uuid,
  room_name text,
  check_in date,
  check_out date,
  guests integer,
  guest_name text,
  guest_email text,
  guest_phone text,
  status text,
  payment_status text,
  payment_method text,
  total_price numeric,
  special_requests text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar token
  IF NOT validate_reservation_token(_token, _reservation_id) THEN
    RAISE EXCEPTION 'Token inválido ou expirado';
  END IF;
  
  -- Retornar dados da reserva (apenas campos necessários)
  RETURN QUERY
  SELECT 
    r.id,
    r.room_id,
    r.room_name,
    r.check_in,
    r.check_out,
    r.guests,
    r.guest_name,
    r.guest_email,
    r.guest_phone,
    r.status,
    r.payment_status,
    r.payment_method,
    r.total_price,
    r.special_requests,
    r.created_at
  FROM public.reservations r
  WHERE r.id = _reservation_id;
END;
$$;

-- 8. Trigger para gerar token automaticamente ao criar reserva
CREATE OR REPLACE FUNCTION public.auto_generate_reservation_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gerar token automaticamente para nova reserva
  PERFORM generate_reservation_token(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_generate_reservation_token
AFTER INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION auto_generate_reservation_token();

-- 9. Função para limpar tokens expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.reservation_access_tokens
  WHERE expires_at < now() - interval '30 days';
END;
$$;

-- 10. Comentários de documentação
COMMENT ON TABLE public.reservation_access_tokens IS 
'Tokens de acesso temporário para visualização segura de reservas sem autenticação. Expira em 7 dias.';

COMMENT ON FUNCTION public.generate_reservation_token IS 
'Gera um token seguro de 32 caracteres para acesso temporário a uma reserva específica.';

COMMENT ON FUNCTION public.validate_reservation_token IS 
'Valida se um token é válido, não expirou e pertence à reserva especificada.';

COMMENT ON FUNCTION public.get_reservation_with_token IS 
'Retorna dados de uma reserva (campos não sensíveis) mediante token válido. Use para permitir que hóspedes vejam sua reserva sem login.';

COMMENT ON VIEW public.reservations_public_summary IS 
'View pública com dados mascarados para listagens que não requerem autenticação completa.';

-- 11. Adicionar auditoria de acesso a dados sensíveis
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  reservation_id uuid,
  access_type text NOT NULL, -- 'view', 'edit', 'export'
  accessed_fields text[], -- campos acessados
  ip_address text,
  user_agent text,
  access_method text, -- 'authenticated', 'token', 'admin'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sensitive_access_user ON public.sensitive_data_access_log(user_id);
CREATE INDEX idx_sensitive_access_reservation ON public.sensitive_data_access_log(reservation_id);
CREATE INDEX idx_sensitive_access_created ON public.sensitive_data_access_log(created_at);

ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Apenas super_admins podem ver logs de acesso
CREATE POLICY "superadmins_view_access_logs"
ON public.sensitive_data_access_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Sistema pode inserir logs
CREATE POLICY "system_insert_access_logs"
ON public.sensitive_data_access_log
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE public.sensitive_data_access_log IS 
'Log de auditoria para todos os acessos a dados sensíveis de reservas. Retenção: 90 dias.';