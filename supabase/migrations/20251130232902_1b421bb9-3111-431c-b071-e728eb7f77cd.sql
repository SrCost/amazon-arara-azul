-- Fix log_audit_activity to handle system operations (service role)
CREATE OR REPLACE FUNCTION public.log_audit_activity()
RETURNS trigger
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
  -- Get user email, default to 'system' for service role operations
  user_email := COALESCE(get_current_user_email(), 'system');
  
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

  -- Insert audit log with UUID type for entity_id
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
    COALESCE(NEW.id, OLD.id),
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