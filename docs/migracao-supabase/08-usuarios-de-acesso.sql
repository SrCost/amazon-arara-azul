-- ============================================================
-- 08-usuarios-de-acesso.sql
-- Cria os 4 usuarios administrativos MANTENDO o mesmo
-- identificador interno (id), para que perfis, cargos e
-- permissoes por modulo continuem ligados corretamente.
--
-- EXECUTE ESTE ARQUIVO NO SQL EDITOR *ANTES* DO 07.
-- Se o 07 falhar com "profiles_id_fkey", e porque este
-- arquivo ainda nao foi executado.
--
-- Senha provisoria de todos: Arara@2026!Trocar
-- Cada pessoa troca depois em /auth > "Esqueci minha senha".
-- ============================================================

-- ------------------------------------------------------------
-- OPCAO A (recomendada) - rodar aqui mesmo, no SQL Editor
-- ------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt('Arara@2026!Trocar', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name, 'email', u.email, 'email_verified', true),
  now(),
  now()
FROM (VALUES
  ('631d2468-c2a6-4eff-926c-d3fda28048b4'::uuid, 'cst.flavio@pousadaararaazul.com', 'Flavio Costa'),
  ('7e1632aa-b7a2-4cfc-9089-64b51abf468d'::uuid, 'kinha@pousadaararaazul.com.br',   'Jessica kinha'),
  ('7d78ab2c-9f8b-47d5-b5d1-3d6b4987c29f'::uuid, 'teste2@gmail.com',                'teste2'),
  ('f2250b21-3e82-416a-864a-ef814197567a'::uuid, 'laracabral@pousadararazul.com',   'Lara Cabral')
) AS u(id, email, full_name)
ON CONFLICT (id) DO NOTHING;

-- Identidade de e-mail (necessaria para o login por e-mail/senha)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.email,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  NULL,
  now(),
  now()
FROM auth.users u
WHERE u.id IN (
  '631d2468-c2a6-4eff-926c-d3fda28048b4',
  '7e1632aa-b7a2-4cfc-9089-64b51abf468d',
  '7d78ab2c-9f8b-47d5-b5d1-3d6b4987c29f',
  'f2250b21-3e82-416a-864a-ef814197567a'
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- CONFERENCIA - deve retornar 4 linhas antes de rodar o 07
-- ------------------------------------------------------------
SELECT id, email, email_confirmed_at IS NOT NULL AS email_confirmado
FROM auth.users
ORDER BY created_at;

-- ------------------------------------------------------------
-- OPCAO B (alternativa) - criar pelo computador, via API admin
-- ------------------------------------------------------------
-- Use apenas se a Opcao A nao for possivel.
-- Salve como criar-usuarios.mjs, preencha as duas variaveis e rode:
--   npm i @supabase/supabase-js
--   node criar-usuarios.mjs
--
-- import { createClient } from '@supabase/supabase-js';
--
-- const URL = 'https://<SEU-PROJETO>.supabase.co';
-- const SERVICE_ROLE = '<SUA-SERVICE-ROLE-KEY>';
-- const admin = createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });
--
-- const usuarios = [
--   { id: '631d2468-c2a6-4eff-926c-d3fda28048b4', email: 'cst.flavio@pousadaararaazul.com' },
--   { id: '7e1632aa-b7a2-4cfc-9089-64b51abf468d', email: 'kinha@pousadaararaazul.com.br' },
--   { id: '7d78ab2c-9f8b-47d5-b5d1-3d6b4987c29f', email: 'teste2@gmail.com' },
--   { id: 'f2250b21-3e82-416a-864a-ef814197567a', email: 'laracabral@pousadararazul.com' },
-- ];
--
-- for (const u of usuarios) {
--   const { error } = await admin.auth.admin.createUser({
--     id: u.id,
--     email: u.email,
--     password: 'Arara@2026!Trocar',
--     email_confirm: true,
--   });
--   console.log(u.email, error ? 'ERRO: ' + error.message : 'criado');
-- }

-- ------------------------------------------------------------
-- Depois: cada pessoa define a propria senha
-- ------------------------------------------------------------
-- Na tela de login do site (/auth), usar "Esqueci minha senha",
-- ou enviar o convite por e-mail:
--   await admin.auth.admin.inviteUserByEmail('email@dominio.com')
--
-- Cargos e permissoes por modulo sao carregados pelo arquivo 07
-- (tabelas profiles, user_roles e user_module_permissions).
