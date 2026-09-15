-- ============================================================
-- 10-verificacao-final.sql
-- Rode no SQL Editor do NOVO projeto, no final da migracao.
-- Compare a coluna "atual" com a coluna "esperado".
-- ============================================================

-- 1) Quantidade de registros por tabela ----------------------
WITH esperado(tabela, esperado) AS (VALUES
  ('rooms', 9), ('packages', 4), ('experiences', 15),
  ('profiles', 4), ('user_roles', 4), ('user_module_permissions', 0),
  ('gallery_images', 33), ('hero_slides', 1), ('google_reviews_cache', 5),
  ('reservations', 14), ('reservation_rooms', 14), ('reservation_experiences', 0),
  ('booking_checkins', 3), ('booking_checkouts', 2), ('booking_tokens', 16),
  ('pre_arrival_responses', 1), ('payments', 1), ('payment_logs', 29),
  ('reservation_access_tokens', 14), ('email_logs', 129), ('contact_messages', 1),
  ('blocked_dates', 13), ('activity_log', 220), ('sensitive_data_access_log', 13)
),
atual AS (
  SELECT 'rooms' t, count(*) c FROM public.rooms
  UNION ALL SELECT 'packages', count(*) FROM public.packages
  UNION ALL SELECT 'experiences', count(*) FROM public.experiences
  UNION ALL SELECT 'profiles', count(*) FROM public.profiles
  UNION ALL SELECT 'user_roles', count(*) FROM public.user_roles
  UNION ALL SELECT 'user_module_permissions', count(*) FROM public.user_module_permissions
  UNION ALL SELECT 'gallery_images', count(*) FROM public.gallery_images
  UNION ALL SELECT 'hero_slides', count(*) FROM public.hero_slides
  UNION ALL SELECT 'google_reviews_cache', count(*) FROM public.google_reviews_cache
  UNION ALL SELECT 'reservations', count(*) FROM public.reservations
  UNION ALL SELECT 'reservation_rooms', count(*) FROM public.reservation_rooms
  UNION ALL SELECT 'reservation_experiences', count(*) FROM public.reservation_experiences
  UNION ALL SELECT 'booking_checkins', count(*) FROM public.booking_checkins
  UNION ALL SELECT 'booking_checkouts', count(*) FROM public.booking_checkouts
  UNION ALL SELECT 'booking_tokens', count(*) FROM public.booking_tokens
  UNION ALL SELECT 'pre_arrival_responses', count(*) FROM public.pre_arrival_responses
  UNION ALL SELECT 'payments', count(*) FROM public.payments
  UNION ALL SELECT 'payment_logs', count(*) FROM public.payment_logs
  UNION ALL SELECT 'reservation_access_tokens', count(*) FROM public.reservation_access_tokens
  UNION ALL SELECT 'email_logs', count(*) FROM public.email_logs
  UNION ALL SELECT 'contact_messages', count(*) FROM public.contact_messages
  UNION ALL SELECT 'blocked_dates', count(*) FROM public.blocked_dates
  UNION ALL SELECT 'activity_log', count(*) FROM public.activity_log
  UNION ALL SELECT 'sensitive_data_access_log', count(*) FROM public.sensitive_data_access_log
)
SELECT e.tabela, e.esperado, a.c AS atual,
       CASE WHEN a.c = e.esperado THEN 'OK' ELSE 'DIVERGENTE' END AS situacao
FROM esperado e JOIN atual a ON a.t = e.tabela
ORDER BY situacao DESC, e.tabela;

-- 2) Estrutura esperada: 26 tabelas, 29 funcoes, 38 gatilhos, 73 politicas
--    (os arquivos 04 e 05 criam exatamente 29 funcoes e 38 gatilhos)
SELECT
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') AS tabelas,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prokind = 'f') AS funcoes,
  (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND NOT t.tgisinternal) AS gatilhos,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS politicas;

-- 3) Nenhuma tabela sem Row Level Security (deve vir vazio)
SELECT c.relname AS tabela_sem_protecao
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

-- 4) Nenhum vinculo quebrado (devem vir todos com zero)
SELECT
  (SELECT count(*) FROM public.reservations r
     LEFT JOIN public.rooms ro ON ro.id = r.room_id WHERE ro.id IS NULL) AS reservas_sem_bangalo,
  (SELECT count(*) FROM public.reservation_rooms rr
     LEFT JOIN public.reservations r ON r.id = rr.reservation_id WHERE r.id IS NULL) AS quartos_sem_reserva,
  (SELECT count(*) FROM public.profiles p
     LEFT JOIN auth.users u ON u.id = p.id WHERE u.id IS NULL) AS perfis_sem_usuario,
  (SELECT count(*) FROM public.user_roles ur
     LEFT JOIN auth.users u ON u.id = ur.user_id WHERE u.id IS NULL) AS cargos_sem_usuario;

-- 5) Arquivos do armazenamento (esperado: 66 no bucket "gallery")
SELECT bucket_id, count(*) AS arquivos,
       pg_size_pretty(sum((metadata->>'size')::bigint)) AS tamanho
FROM storage.objects GROUP BY bucket_id;

-- 6) Rotinas agendadas (esperado: 3 ativas)
SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;

-- 7) Usuarios, cargos e permissoes
SELECT u.email, r.role, p.full_name,
       (SELECT count(*) FROM public.user_module_permissions m WHERE m.user_id = u.id) AS modulos_configurados
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at;
