CREATE TABLE public.fnrh_credentials (
  id text NOT NULL PRIMARY KEY DEFAULT 'default',
  api_user text NOT NULL,
  api_password text NOT NULL,
  cpf_solicitante text NOT NULL,
  env text NOT NULL DEFAULT 'producao',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_by_email text,
  CONSTRAINT fnrh_credentials_singleton CHECK (id = 'default'),
  CONSTRAINT fnrh_credentials_env_check CHECK (env IN ('producao','homologacao'))
);

GRANT ALL ON public.fnrh_credentials TO service_role;

ALTER TABLE public.fnrh_credentials ENABLE ROW LEVEL SECURITY;