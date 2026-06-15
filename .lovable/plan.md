# Roteamento de notificações de contato

## Objetivo
Notificações de novas mensagens enviadas pelo formulário em `/contato` devem ir para **reservas@pousadararazul.com** ao invés de **adm@pousadararazul.com**.

## Mudança
Em `supabase/functions/send-internal-notification/index.ts`, ajustar o destinatário **apenas** para o tipo `new_message`. As notificações de `new_reservation` e `cancellation` continuam indo para `adm@pousadararazul.com` (sem alteração).

## Detalhes técnicos
- Substituir a constante única `ADMIN_EMAIL` por um mapa por tipo:
  - `new_message` → `reservas@pousadararazul.com`
  - `new_reservation` → `adm@pousadararazul.com`
  - `cancellation` → `adm@pousadararazul.com`
- Usar o e-mail correspondente ao `type` no campo `to` da chamada ao Resend.
- Nenhuma outra alteração (template, assunto, RLS, frontend) é necessária.
