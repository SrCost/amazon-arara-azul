-- =====================================================
-- CORREÇÃO 1: Trigger de Sincronização de Pagamentos
-- =====================================================

-- Drop existing trigger and function with CASCADE
DROP TRIGGER IF EXISTS trg_sync_payment_status ON payments;
DROP TRIGGER IF EXISTS sync_payment_to_reservation ON payments;
DROP FUNCTION IF EXISTS public.sync_payment_status_to_reservation() CASCADE;

-- Recreate improved sync function
CREATE OR REPLACE FUNCTION public.sync_payment_status_to_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation_status TEXT;
BEGIN
  -- Map payment status to reservation payment_status
  CASE NEW.status
    WHEN 'completed' THEN reservation_status := 'paid';
    WHEN 'pending' THEN reservation_status := 'pending';
    WHEN 'failed' THEN reservation_status := 'failed';
    WHEN 'refunded' THEN reservation_status := 'refunded';
    ELSE reservation_status := 'pending';
  END CASE;

  -- Update the corresponding reservation
  UPDATE public.reservations
  SET payment_status = reservation_status,
      payment_method = NEW.payment_method,
      updated_at = NOW()
  WHERE id = NEW.reservation_id;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic sync
CREATE TRIGGER trg_sync_payment_status
AFTER UPDATE OF status ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.sync_payment_status_to_reservation();

-- =====================================================
-- CORREÇÃO 5: Sistema de Auditoria Automática
-- =====================================================

-- Function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_email, 'system');
END;
$$;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  action_type TEXT;
  description TEXT;
  entity_type TEXT;
BEGIN
  -- Get user email
  user_email := get_current_user_email();
  
  -- Determine entity type from table name
  entity_type := TG_TABLE_NAME;
  
  -- Build description based on operation
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    description := 'Novo registro criado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    description := 'Registro atualizado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    description := 'Registro excluído de ' || TG_TABLE_NAME;
  END IF;

  -- Insert audit log
  INSERT INTO public.activity_log (
    user_id,
    user_email,
    action,
    description,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    auth.uid(),
    user_email,
    action_type,
    description,
    entity_type,
    COALESCE(NEW.id::text, OLD.id::text),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', NOW()
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create audit triggers for critical tables

-- Payments audit trigger
DROP TRIGGER IF EXISTS trg_audit_payments ON payments;
CREATE TRIGGER trg_audit_payments
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_activity();

-- Reservations audit trigger
DROP TRIGGER IF EXISTS trg_audit_reservations ON reservations;
CREATE TRIGGER trg_audit_reservations
AFTER INSERT OR UPDATE OR DELETE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_activity();

-- Profiles audit trigger
DROP TRIGGER IF EXISTS trg_audit_profiles ON profiles;
CREATE TRIGGER trg_audit_profiles
AFTER UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_activity();

-- User roles audit trigger
DROP TRIGGER IF EXISTS trg_audit_user_roles ON user_roles;
CREATE TRIGGER trg_audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_activity();

-- Contact messages audit trigger
DROP TRIGGER IF EXISTS trg_audit_contact_messages ON contact_messages;
CREATE TRIGGER trg_audit_contact_messages
AFTER UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_activity();