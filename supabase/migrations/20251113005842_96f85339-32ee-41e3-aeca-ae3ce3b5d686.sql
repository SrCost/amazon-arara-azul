-- Remover política antiga que pode estar causando problemas
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;

-- Criar nova política mais permissiva para inserção anônima
CREATE POLICY "Public can create reservations"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Garantir que apenas admins podem atualizar reservas
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;

CREATE POLICY "Admins can update reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Garantir que apenas admins podem deletar reservas
DROP POLICY IF EXISTS "Admins can delete reservations" ON public.reservations;

CREATE POLICY "Admins can delete reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Ajustar política de visualização para incluir reservas anônimas por email
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;

CREATE POLICY "Users can view their own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  -- Admins podem ver tudo
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Usuários podem ver suas próprias reservas
  auth.uid() = user_id OR
  -- Usuários podem ver reservas feitas com seu email quando não estavam logados
  (user_id IS NULL AND guest_email = get_current_user_email())
);