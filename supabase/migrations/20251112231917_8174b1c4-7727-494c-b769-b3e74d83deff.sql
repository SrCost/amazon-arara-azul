-- FASE 6: Audit logging for profiles and user_roles tables

-- Add audit logging triggers for profiles table
DROP TRIGGER IF EXISTS trg_audit_profiles_update ON public.profiles;
DROP TRIGGER IF EXISTS trg_audit_profiles_delete ON public.profiles;

CREATE TRIGGER trg_audit_profiles_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_profiles_delete
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

-- Add audit logging triggers for user_roles table
DROP TRIGGER IF EXISTS trg_audit_user_roles_insert ON public.user_roles;
DROP TRIGGER IF EXISTS trg_audit_user_roles_update ON public.user_roles;
DROP TRIGGER IF EXISTS trg_audit_user_roles_delete ON public.user_roles;

CREATE TRIGGER trg_audit_user_roles_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_user_roles_update
AFTER UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_user_roles_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

-- Ensure RLS policies for user_roles are correct
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

-- Allow super_admins to insert roles (for creating new users)
CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to update roles
CREATE POLICY "Super admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admins to delete roles
CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Ensure profiles RLS policies allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() = id
);

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add comments for documentation
COMMENT ON TRIGGER trg_audit_profiles_update ON public.profiles IS 
'Logs all UPDATE operations on profiles to audit_log';

COMMENT ON TRIGGER trg_audit_profiles_delete ON public.profiles IS 
'Logs all DELETE operations on profiles to audit_log';

COMMENT ON TRIGGER trg_audit_user_roles_insert ON public.user_roles IS 
'Logs all INSERT operations on user_roles to audit_log';

COMMENT ON TRIGGER trg_audit_user_roles_update ON public.user_roles IS 
'Logs all UPDATE operations on user_roles to audit_log - tracks role changes';

COMMENT ON TRIGGER trg_audit_user_roles_delete ON public.user_roles IS 
'Logs all DELETE operations on user_roles to audit_log';

COMMENT ON POLICY "Super admins can insert roles" ON public.user_roles IS 
'Allow super_admins to assign roles to new users';

COMMENT ON POLICY "Super admins can update roles" ON public.user_roles IS 
'Allow super_admins to change user roles - changes are immediately reflected';

COMMENT ON POLICY "Super admins can delete roles" ON public.user_roles IS 
'Allow super_admins to remove user role assignments';

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 
'Allow admins and super_admins to view all user profiles, users can view their own';

COMMENT ON POLICY "Super admins can manage all profiles" ON public.profiles IS 
'Allow super_admins full control over all profiles';