

# Correção: Emails automáticos de check-in/checkout não são enviados

## Causa raiz
O cron job `daily-guest-emails` executa às 10:00 AM mas **falha** com o erro:
```
ERROR: schema "net" does not exist — net.http_post(...)
```

A extensão `pg_net` **não está habilitada** no banco. O `pg_cron` está ativo, mas sem `pg_net` não consegue fazer HTTP POST para chamar a edge function.

## Correção

### 1. Habilitar a extensão `pg_net`
Executar via migration:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### 2. Recriar o cron job com referência correta
Dropar o job atual e recriá-lo usando `extensions.http_post` (path completo) para garantir compatibilidade:
```sql
SELECT cron.unschedule('daily-guest-emails');

SELECT cron.schedule(
  'daily-guest-emails',
  '0 10 * * *',
  $$
  SELECT extensions.http_post(
    url:='https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/cron-guest-emails',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
```

### Arquivos a editar
Nenhum arquivo de código precisa ser alterado. Apenas SQL no banco de dados.

