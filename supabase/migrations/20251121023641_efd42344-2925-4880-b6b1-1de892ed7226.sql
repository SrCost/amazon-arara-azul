
-- Garantir que visitantes não logados possam criar reservas
-- Esta política substitui/melhora a política existente "Public can create reservations"

DROP POLICY IF EXISTS "Public can create reservations" ON reservations;
DROP POLICY IF EXISTS "Anyone can create reservations" ON reservations;
DROP POLICY IF EXISTS "public_insert_reservations" ON reservations;

-- Nova política otimizada para permitir INSERT anônimo
CREATE POLICY "allow_anonymous_reservation_insert" 
ON reservations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Garantir que a política de SELECT permite visualizar reservas próprias
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;

CREATE POLICY "users_view_own_reservations" 
ON reservations 
FOR SELECT 
TO authenticated
USING (
  -- Admins veem tudo
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  -- Usuários veem suas próprias reservas (por user_id ou email)
  auth.uid() = user_id OR 
  (user_id IS NULL AND guest_email = get_current_user_email())
);
