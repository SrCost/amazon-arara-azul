
-- contact_messages: replace permissive INSERT with validated check
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can create contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(message) BETWEEN 1 AND 2000
  AND (phone IS NULL OR char_length(phone) <= 30)
);

-- activity_log: restrict inserts to service_role only
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_log;
CREATE POLICY "Service role can insert activity logs"
ON public.activity_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- sensitive_data_access_log: restrict to service_role
DROP POLICY IF EXISTS "system_insert_access_logs" ON public.sensitive_data_access_log;
CREATE POLICY "service_role_insert_access_logs"
ON public.sensitive_data_access_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- reservation_access_tokens: restrict to service_role
DROP POLICY IF EXISTS "system_insert_tokens" ON public.reservation_access_tokens;
CREATE POLICY "service_role_insert_tokens"
ON public.reservation_access_tokens
FOR INSERT
TO service_role
WITH CHECK (true);
