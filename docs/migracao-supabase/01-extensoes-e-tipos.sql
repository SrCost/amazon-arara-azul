-- ============================================================
-- 01-extensoes-e-tipos.sql
-- Execute PRIMEIRO, no SQL Editor do novo projeto Supabase.
-- ============================================================

-- Extensoes usadas pelo projeto -------------------------------
-- pgcrypto: usada por generate_reservation_token (gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- uuid-ossp: geracao de identificadores
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- pg_net: chamadas HTTP a partir das rotinas agendadas
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- pg_cron: rotinas automaticas diarias (arquivo 06)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Tipos proprios ---------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_source_type') THEN
    CREATE TYPE public.reservation_source_type AS ENUM ('site', 'whatsapp', 'booking', 'airbnb', 'agency', 'manual');
  END IF;
END
$$;
