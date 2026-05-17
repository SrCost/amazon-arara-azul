## Diagnóstico

Consultei o Resend e o banco — os dois emails para `AnneWegele@gmx.de` foram **entregues**:

| Envio | Status no Resend | Observação |
|---|---|---|
| `e795d381…` (00:40) | **delivered** | aceito pela GMX |
| `63e8c4d3…` (01:17) | **clicked** | aberto e link clicado |

Ou seja, o email saiu, chegou na GMX e foi clicado pela hóspede. Provavelmente caiu na **caixa de Spam/Promoções** (GMX é rigorosa) e a hóspede não viu na caixa principal — daí a percepção de "não chegou".

### Causa raiz real (que precisa ser corrigida)

1. **A reserva foi salva com `guest_language = 'pt'`** mesmo sendo de uma hóspede alemã (`gmx.de`, nome Anne Kathrin Wegele). Os modais do PMS (`NewReservationModal` e `EditReservationModal`) **não capturam idioma** — sempre cai no default `pt`. Resultado: enviamos um email em português para uma hóspede alemã, o que aumenta muito a chance de:
   - parecer spam para o filtro da GMX;
   - ser ignorado pela hóspede mesmo se chegar à inbox.
2. **Não existe visibilidade de entrega no admin** — o operador não sabe se o email foi entregue, aberto ou rejeitado. Por isso a dúvida "não chegou?".
3. **Não existe reenvio manual** a partir do calendário do PMS.
4. O subject `🌿 Reserva confirmada – Pousada Arara Azul` usa emoji + acento — sem DMARC pode contribuir para spam em ISPs alemães.

## Plano de correção

### 1. Capturar idioma do hóspede no PMS
Em `NewReservationModal.tsx` e `EditReservationModal.tsx`:
- Novo campo **Idioma do hóspede** (PT/EN/ES/FR/DE) gravado em `reservations.guest_language`.
- **Auto-detecção inteligente** ao preencher nome/email (sem sobrescrever escolha manual):
  - TLD do email (`.de→de`, `.es→es`, `.fr→fr`, `.pt/.br→pt`, `.com/.co.uk/.us→en`).
  - Fallback por nacionalidade quando informada.
  - Default `pt`.

### 2. Enviar o email no idioma correto e registrar
- Após salvar a reserva manual, o handler já chama `send-reservation-email`; passar `lang: form.guest_language` no body.
- `send-reservation-email` já suporta os 5 idiomas — só precisa receber o parâmetro.

### 3. Reenvio manual a partir do calendário
- Botão **"Reenviar email de confirmação"** no popover/modal de detalhes da reserva no `/admin/calendario-reservas`, chamando `send-reservation-email` com `force: true` (bypassa idempotência) e o `lang` atual da reserva.
- Toast de sucesso/erro.

### 4. Visibilidade de entrega (garantia de recebimento)
- Nova edge function `resend-webhook` (público, sem JWT) que recebe os eventos do Resend (`email.delivered`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`) e atualiza `email_logs.status` + `metadata`.
- Configurar o webhook no painel do Resend apontando para essa função.
- Mostrar o status real ("Entregue", "Aberto", "Devolvido") no modal de edição da reserva e no popover do calendário, ao lado do botão de reenvio.

### 5. Melhorias de deliverability (rápidas)
- Remover emoji do `subject` para idiomas que costumam ter mais filtragem (DE/EN); manter conteúdo do corpo.
- Adicionar `Reply-To: reservas@pousadararazul.com` explícito e `List-Unsubscribe` no header (boa prática anti-spam — ajuda muito em GMX/Yahoo/Outlook).
- (Pós-implementação) Confirmar no DNS do domínio se já existe registro **DMARC** (`_dmarc.pousadararazul.com`); se não, instruir a adicionar `v=DMARC1; p=none; rua=mailto:dmarc@pousadararazul.com` para começar a monitorar. Isso é só uma instrução para o usuário fazer no provedor DNS — não há código.

## Arquivos afetados

- `src/components/admin/calendar/NewReservationModal.tsx` — campo idioma + auto-detect + `guest_language` no insert + `lang` no invoke.
- `src/components/admin/calendar/EditReservationModal.tsx` — campo idioma + persistência + botão **Reenviar email**.
- `src/components/admin/calendar/ReservationBlock.tsx` ou `DraggableReservationBlock.tsx` — badge com status de entrega (quando disponível).
- `supabase/functions/send-reservation-email/index.ts` — adicionar headers `Reply-To` e `List-Unsubscribe`; remover emoji do subject de EN/DE.
- `supabase/functions/resend-webhook/index.ts` (novo) — receber eventos do Resend e atualizar `email_logs`.
- `supabase/config.toml` — `verify_jwt = false` para `resend-webhook`.

## Fora do escopo

- Trocar provedor de email.
- Mudar templates visuais.
- Migrar para Lovable Emails (manteremos Resend como hoje).

## Ação imediata para a reserva da Anne

Após implementar, vou **reenviar manualmente** o email em **alemão** para `AnneWegele@gmx.de` usando o novo botão de reenvio, garantindo que ela receba a confirmação no idioma certo.
