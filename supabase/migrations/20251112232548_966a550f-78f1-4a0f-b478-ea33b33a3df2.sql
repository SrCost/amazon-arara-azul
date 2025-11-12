-- FASE 7: Complete audit system with retention policy

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify all critical tables have audit triggers
-- Reservations triggers (already exist, verify)
DROP TRIGGER IF EXISTS trg_audit_reservations_insert ON public.reservations;
DROP TRIGGER IF EXISTS trg_audit_reservations_update ON public.reservations;
DROP TRIGGER IF EXISTS trg_audit_reservations_delete ON public.reservations;

CREATE TRIGGER trg_audit_reservations_insert
AFTER INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_reservations_update
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_reservations_delete
AFTER DELETE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

-- Schedule automated cleanup job to run daily at 2 AM
-- Deletes audit_log entries older than 15 days
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 2 * * *', -- Every day at 2:00 AM
  $$
  DELETE FROM public.activity_log 
  WHERE created_at < NOW() - INTERVAL '15 days';
  $$
);

-- Add index to improve cleanup performance
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at 
ON public.activity_log(created_at);

-- Add index for common filters (user_id, entity_type, action)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id 
ON public.activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type 
ON public.activity_log(entity_type);

CREATE INDEX IF NOT EXISTS idx_activity_log_action 
ON public.activity_log(action);

-- Add comments for documentation
COMMENT ON INDEX idx_activity_log_created_at IS 
'Index for efficient cleanup of old audit logs';

COMMENT ON INDEX idx_activity_log_user_id IS 
'Index for filtering audit logs by user';

COMMENT ON INDEX idx_activity_log_entity_type IS 
'Index for filtering audit logs by entity type (table name)';

COMMENT ON INDEX idx_activity_log_action IS 
'Index for filtering audit logs by action type (create/update/delete)';

COMMENT ON TRIGGER trg_audit_reservations_insert ON public.reservations IS 
'Logs all INSERT operations on reservations to audit_log';

COMMENT ON TRIGGER trg_audit_reservations_update ON public.reservations IS 
'Logs all UPDATE operations on reservations to audit_log';

COMMENT ON TRIGGER trg_audit_reservations_delete ON public.reservations IS 
'Logs all DELETE operations on reservations to audit_log';