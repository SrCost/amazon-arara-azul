-- FASE 4: Add DELETE policy and audit logging for contact_messages

-- Add DELETE policy for contact_messages (only admins and super_admins)
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add audit logging trigger for UPDATE on contact_messages
CREATE TRIGGER trg_audit_messages_update
AFTER UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

-- Add audit logging trigger for DELETE on contact_messages
CREATE TRIGGER trg_audit_messages_delete
AFTER DELETE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

COMMENT ON POLICY "Admins can delete contact messages" ON public.contact_messages IS 
'Allow admins and super_admins to delete contact messages';

COMMENT ON TRIGGER trg_audit_messages_update ON public.contact_messages IS 
'Logs all UPDATE operations on contact_messages to audit_log';

COMMENT ON TRIGGER trg_audit_messages_delete ON public.contact_messages IS 
'Logs all DELETE operations on contact_messages to audit_log';