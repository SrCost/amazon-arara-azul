# E-mail automático de Pré Check-in (FNRH)

Adição pontual: novo e-mail enviado uma única vez após a confirmação da reserva, com link para o formulário oficial do FNRH. Nada do fluxo atual é alterado.

## Levantamento (verificado)

- Já existe fluxo de e-mail transacional com Resend na função `send-reservation-email`, com template premium (logo em storage, cores verdes, rodapé) e i18n em pt/en/es/fr/de.
- A confirmação da reserva dispara `send-reservation-email` com `type: 'reservation_confirmed'` em quatro pontos: `mp-webhook` (PIX aprovado), `create-card-payment` (cartão aprovado), e no dashboard em `NewReservationModal` e `EditReservationModal`.
- Idempotência de e-mails já é feita consultando `email_logs` por `reservation_id` + `email_type` (padrão usado no `cron-guest-emails` e no `EditReservationModal`).
- `reservations.guest_language` define o idioma do e-mail.

## O que será feito

### 1. Banco de dados (apenas adição)

- Nova coluna `reservations.pre_checkin_email_sent boolean not null default false` e `pre_checkin_email_sent_at timestamptz`. Nenhum campo existente é alterado, nenhuma tabela/trigger existente é modificada.

### 2. Nova Edge Function `send-pre-checkin-email`

- Recebe `{ reservationId }`, busca a reserva com service_role.
- Trava dupla contra duplicidade: `pre_checkin_email_sent = true` OU registro em `email_logs` com `email_type = 'pre_checkin'` → não envia.
- Envia via Resend, mesmo remetente e mesmo template visual dos e-mails atuais (logo, paleta verde amazônico, rodapé, política de cancelamento fora do escopo).
- Assunto: `Antecipe seu Check-in — Pousada Arara Azul` (traduzido nos 5 idiomas).
- Corpo: saudação com nome, dados da reserva (código, bangalô, check-in/check-out), explicação de que o pré check-in é exigência do Ministério do Turismo (FNRH) e botão **Fazer Pré Check-in** apontando para a URL oficial do FNRH informada.
- Após envio: grava `email_logs` (`email_type = 'pre_checkin'`) e marca `pre_checkin_email_sent`/`pre_checkin_email_sent_at`.

### 3. Conexão com o fluxo existente

- Nos mesmos quatro pontos que já disparam `reservation_confirmed`, adicionar uma chamada extra (fire-and-forget, sem alterar a lógica existente nem bloquear o fluxo em caso de falha) para `send-pre-checkin-email`.
- Rede de segurança: no cron diário já existente (`cron-guest-emails`), incluir um bloco novo que envia o pré check-in para reservas confirmadas que ainda estejam com `pre_checkin_email_sent = false`, respeitando a mesma trava.

### 4. Validação em preview

- Enviar o e-mail de teste para uma reserva marcada como `is_test`, conferir renderização e confirmar que a segunda chamada não reenvia.

## Observações técnicas

- `verify_jwt = false` para a nova função em `supabase/config.toml` (padrão das demais funções de e-mail).
- Nenhuma função, trigger, tabela ou template existente é renomeado ou refatorado.
- O PDF de QR Code enviado no chat não será usado como anexo (os e-mails do projeto não usam anexos); se quiser, posso adicionar o QR como imagem dentro do e-mail em uma etapa seguinte.
