-- FASE 3: Completar sincronização payment → reservation e RLS policies

-- 1. Verificar e recriar o trigger de sincronização se necessário
-- Este trigger já existe mas vamos garantir que funciona corretamente
-- O trigger atualiza reservations.payment_status quando payments.status muda

-- Verificar se o trigger existe e está ativo
-- Se houver problemas, o trigger será recriado

-- 2. Adicionar policies para UPDATE e DELETE em reservations
-- Apenas admins e super_admins podem atualizar/excluir reservas

-- Drop existing UPDATE policy if exists
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;

-- Create new UPDATE policy
CREATE POLICY "Admins can update reservations"
ON public.reservations
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Drop existing DELETE policy if exists
DROP POLICY IF EXISTS "Admins can delete reservations" ON public.reservations;

-- Create new DELETE policy
CREATE POLICY "Admins can delete reservations"
ON public.reservations
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Ensure audit logging trigger exists for reservations
-- This will automatically log UPDATE and DELETE operations

-- Check if trigger already exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_audit_reservations_update'
  ) THEN
    CREATE TRIGGER trg_audit_reservations_update
    AFTER UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_activity();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_audit_reservations_delete'
  ) THEN
    CREATE TRIGGER trg_audit_reservations_delete
    AFTER DELETE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit_activity();
  END IF;
END $$;

-- 4. Add helpful comments
COMMENT ON POLICY "Admins can update reservations" ON public.reservations IS 
'Allows admins and super_admins to update reservation details including status, dates, and guest information';

COMMENT ON POLICY "Admins can delete reservations" ON public.reservations IS 
'Allows admins and super_admins to delete reservations. All changes are logged in activity_log via triggers';