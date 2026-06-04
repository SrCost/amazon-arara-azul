## Problema

A homepage exibe avaliações da `google_reviews_cache`, mas o cache foi populado pela última vez em **02/03/2026**. A edge function `fetch-google-reviews` existe e funciona, mas **não há agendamento** — ela só roda quando chamada manualmente, então comentários novos no Google Maps nunca entram automaticamente.

## Solução

Agendar a função `fetch-google-reviews` para rodar **1x por dia** usando `pg_cron` + `pg_net` (já é o padrão usado em outras automações do projeto, como `cron-guest-emails`), e disparar uma execução imediata para já popular as avaliações novas.

## Passos

1. **Migration** habilitando (se necessário) `pg_cron` e `pg_net`, e criando um job diário:
   - Nome: `refresh-google-reviews-daily`
   - Horário: `0 3 * * *` (03:00 UTC = 00:00 Manaus)
   - Ação: `net.http_post` para `https://lhcjucaevoouqozihzpv.supabase.co/functions/v1/fetch-google-reviews` com header `Authorization: Bearer <anon key>`
2. **Disparo imediato** da função para atualizar o cache agora (chamada via curl da edge function).
3. **Pequeno ajuste de robustez** em `fetch-google-reviews/index.ts`: hoje, se a Google API responder com erro, a função sai sem limpar nem atualizar o cache (ok). Mas, se vier OK e zero reviews com rating ≥ 4, ela apagaria tudo. Adicionar guarda: só limpar/reescrever o cache quando `filtered.length > 0`.

## Validação

- Conferir via `SELECT * FROM cron.job` (admin) que o job ficou criado.
- Após o disparo manual, conferir `google_reviews_cache` com `updated_at` recente e os comentários novos aparecendo na home.

## Observação

A Google Places Details API retorna no máximo as ~5 avaliações mais relevantes/recentes selecionadas pelo Google — não é possível trazer o histórico completo. O cron garante que, conforme o Google rotacionar as reviews exibidas, o site capture as novas em até 24h.
