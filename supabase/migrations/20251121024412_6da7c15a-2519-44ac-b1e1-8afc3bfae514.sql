
-- ===================================================================
-- FASE 3: CORREÇÕES DE PERMISSÕES E RLS
-- ===================================================================
-- Este script corrige as políticas RLS para que users e admins possam
-- visualizar dados corretamente conforme suas funções

-- ==================================================================
-- 1. CORREÇÃO DAS POLÍTICAS DE RESERVATIONS
-- ==================================================================
-- Garantir que users possam ver dados (suas próprias reservas + visualização geral)
-- Garantir que admins possam gerenciar reservas

DROP POLICY IF EXISTS "users_view_own_reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view assigned reservations" ON reservations;

-- Users podem ver suas próprias reservas (por user_id ou email)
CREATE POLICY "users_select_own_reservations"
ON reservations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  (user_id IS NULL AND guest_email = get_current_user_email())
);

-- Admins podem ver todas as reservas
CREATE POLICY "admins_select_all_reservations"
ON reservations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Users podem editar suas próprias reservas
CREATE POLICY "users_update_own_reservations"
ON reservations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins podem atualizar todas as reservas
CREATE POLICY "admins_update_all_reservations"
ON reservations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admins podem deletar reservas
CREATE POLICY "admins_delete_reservations"
ON reservations
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- ==================================================================
-- 2. CORREÇÃO DAS POLÍTICAS DE CONTACT_MESSAGES
-- ==================================================================
DROP POLICY IF EXISTS "Users can view messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_messages;

-- Users podem ver mensagens
CREATE POLICY "users_select_messages"
ON contact_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Users podem atualizar mensagens (marcar como lidas, responder)
CREATE POLICY "users_update_messages"
ON contact_messages
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Users podem deletar mensagens
CREATE POLICY "users_delete_messages"
ON contact_messages
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- ==================================================================
-- 3. CORREÇÃO DAS POLÍTICAS DE PAYMENTS
-- ==================================================================
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Users podem ver pagamentos relacionados às suas reservas
CREATE POLICY "users_select_own_payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.id = payments.reservation_id
    AND (
      reservations.user_id = auth.uid() OR
      (reservations.user_id IS NULL AND reservations.guest_email = get_current_user_email())
    )
  )
);

-- ==================================================================
-- 4. CORREÇÃO DAS POLÍTICAS DE GALLERY_IMAGES
-- ==================================================================
-- Users podem ver galeria (apenas imagens ativas)
DROP POLICY IF EXISTS "Anyone can view active gallery images" ON gallery_images;

CREATE POLICY "public_select_active_gallery"
ON gallery_images
FOR SELECT
USING (is_active = true);

-- Users autenticados podem fazer upload
CREATE POLICY "users_insert_gallery"
ON gallery_images
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'user'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- ==================================================================
-- 5. CORREÇÃO DAS POLÍTICAS DE PACKAGES
-- ==================================================================
-- Garantir que packages_public view esteja disponível para todos
-- Já está configurado via view, sem necessidade de RLS adicional

-- ==================================================================
-- 6. CORREÇÃO DAS POLÍTICAS DE ROOMS
-- ==================================================================
-- Admins podem gerenciar rooms (bangalôs)
DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;

CREATE POLICY "admins_manage_rooms"
ON rooms
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- ==================================================================
-- COMENTÁRIOS IMPORTANTES
-- ==================================================================
-- PERMISSÕES IMPLEMENTADAS:
--
-- USER (role: user):
--   - Pode ver: /admin, /admin/reservations, /admin/messages, /admin/gallery
--   - Pode editar: suas próprias reservas
--   - Pode responder/editar: mensagens
--   - Pode deletar: mensagens
--   - Pode fazer upload: galeria
--
-- ADMIN (role: admin):
--   - Pode ver: tudo exceto /admin/users e /admin/audit
--   - Pode editar: pagamentos, bangalôs, pacotes, todas as reservas
--   - Pode gerenciar: gallery, packages, rooms
--
-- SUPER_ADMIN (role: super_admin):
--   - Pode ver: tudo
--   - Pode editar: tudo
--   - Pode criar/editar/deletar: usuários
--   - Pode acessar: /admin/audit
-- ==================================================================
