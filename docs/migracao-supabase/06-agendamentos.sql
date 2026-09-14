-- ============================================================
-- 06-agendamentos.sql
-- Rotinas automaticas diarias (pg_cron).
-- ANTES de executar: troque <SEU-PROJETO> pela referencia do novo
-- projeto Supabase e <SUA-SERVICE-ROLE-KEY> pela chave secreta
-- do novo projeto (Project Settings > API).
-- ============================================================

-- 1) Limpeza diaria dos registros de auditoria (mantem 15 dias) - 02:00
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 2 * * *',
  $$
  DELETE FROM public.activity_log
  WHERE created_at < NOW() - INTERVAL '15 days';
  $$
);

-- 2) Atualizacao diaria das avaliacoes do Google - 03:00
SELECT cron.schedule(
  'refresh-google-reviews-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://<SEU-PROJETO>.supabase.co/functions/v1/fetch-google-reviews',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SUA-SERVICE-ROLE-KEY>"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  );
  $$
);

-- 3) E-mails automaticos de hospede (pre-chegada / check-in / check-out) - 10:00
SELECT cron.schedule(
  'daily-guest-emails',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://<SEU-PROJETO>.supabase.co/functions/v1/cron-guest-emails',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SUA-SERVICE-ROLE-KEY>"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Conferencia:
-- SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;
