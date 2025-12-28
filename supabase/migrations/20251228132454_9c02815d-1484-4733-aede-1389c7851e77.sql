-- Criar tabela para controle de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Política para service_role gerenciar rate_limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- Índice para busca rápida por key
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);

-- Índice para limpeza de registros antigos
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Função para verificar/incrementar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Tentar obter registro existente
  SELECT count, window_start INTO v_count, v_window_start
  FROM rate_limits WHERE key = p_key;
  
  -- Se não existe, criar novo registro
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, window_start) 
    VALUES (p_key, 1, NOW())
    ON CONFLICT (key) DO NOTHING;
    RETURN TRUE;
  END IF;
  
  -- Se a janela expirou, resetar contador
  IF v_window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN
    UPDATE rate_limits 
    SET count = 1, window_start = NOW() 
    WHERE key = p_key;
    RETURN TRUE;
  END IF;
  
  -- Se excedeu o limite, bloquear
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Incrementar contador
  UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN TRUE;
END;
$$;

-- Função para limpar rate limits antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Conceder permissões para anon e authenticated chamarem a função
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;