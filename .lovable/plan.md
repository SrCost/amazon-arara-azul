

# Correções: Checkout, Admin Details e Links de Email

## 1. Checkout — Tela de sucesso unificada
Atualmente existem dois steps separados (`success_high` e `success_low`). Unificar em uma unica tela de sucesso que:
- Agradece o hospede
- Mostra o comentario enviado
- Sempre exibe o botao "Avaliar no Google" (independente da nota)
- Mantem o envio de feedback interno quando nota < 4

**Arquivo:** `src/pages/Checkout.tsx`

## 2. Admin — Botao para ver detalhes de check-in/check-out
Adicionar um botao "Detalhes" em cada linha da tabela que abre um modal com:
- Dados do check-in: documento, horario de chegada, notas, data de conclusao
- Dados do check-out: nota, comentario, problemas
- Tudo em um unico modal com secoes separadas

**Arquivo:** `src/pages/admin/GuestAutomation.tsx`

## 3. Links nos emails — Usar dominio correto
Os edge functions `send-checkin-email` e `send-checkout-email` usam `SITE_URL` com fallback para `pousada-arara-azul.lovable.app`. Preciso saber: qual e o dominio correto do site? (ex: `pousadararazul.com`). Atualizarei o secret `SITE_URL` e o fallback nas 3 edge functions.

**Arquivos:** `supabase/functions/send-checkin-email/index.ts`, `supabase/functions/send-checkout-email/index.ts`, `supabase/functions/cron-guest-emails/index.ts`

