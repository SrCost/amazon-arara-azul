

# Fase 1 — Itens Críticos (1, 2, 3)

Itens 4-7 (e-mails internos, rodapé, dashboard mobile, UX geral) serão tratados na Fase 2, após aprovação desta fase.

---

## 1. Política de Cancelamento no E-mail de Confirmação e Check-in

### O que muda
Adicionar bloco de política de cancelamento nos templates HTML dos e-mails:
- **`send-reservation-email`** — template `reservation_confirmed`: inserir seção após os detalhes da reserva (após a tabela de valores) com texto curto + link para PDF
- **`send-checkin-email`** — template de check-in digital: inserir a mesma seção após os dados de datas

### Texto da seção
> **Política de Cancelamento**
> Cancelamento com até 30 dias: reembolso parcial conforme política. Menos de 7 dias do check-in ou no-show: sem reembolso.
> [Ver política completa (PDF)]

Link: `https://pousadararazul.com/docs/politica-cancelamento.pdf`

### Arquivos alterados
- `supabase/functions/send-reservation-email/index.ts` (template `getReservationConfirmedEmailPremium`)
- `supabase/functions/send-checkin-email/index.ts` (template HTML)
- Redeploy de ambas Edge Functions

---

## 2. Adaptação do Check-in para FNRH

### Campos que já existem na tabela `booking_checkins`
- `document` (CPF/Passaporte) ✓
- `notes` ✓
- `estimated_arrival_time` ✓

### Campos que já existem na tabela `reservations`
- `birth_date`, `nationality`, `address`, `cpf`, `country`, `passport` ✓

### Novos campos necessários na `booking_checkins` (via migration)
- `full_name` (text) — nome completo no ato do check-in
- `birth_date` (date)
- `nationality` (text)
- `city_state` (text) — cidade/estado de origem
- `address` (text) — endereço completo
- `transport_mode` (text) — meio de transporte
- `travel_reason` (text) — motivo da viagem

### Mudanças na função `submit_checkin`
Atualizar para aceitar os novos parâmetros e gravá-los na tabela.

### Mudanças no frontend (`src/pages/Checkin.tsx`)
- Adicionar os novos campos ao formulário (com labels em português)
- Campos obrigatórios: nome completo, documento, data de nascimento, nacionalidade, cidade/estado
- Campos opcionais: endereço, meio de transporte, motivo da viagem
- Atualizar o schema Zod
- Select para motivo da viagem: Lazer, Negócios, Eventos, Saúde, Outros
- Select para meio de transporte: Carro, Ônibus, Avião + Barco, Barco, Outros

---

## 3. Sincronização de Status (Calendário x Reservations)

### Situação atual
Ambas as telas já gravam `status` e `operational_status` com o mesmo valor — isso já foi implementado na última iteração. Preciso verificar se há alguma divergência restante.

### Verificação
- `EditReservationModal.tsx` (calendário): grava `status: data.operational_status` e `operational_status: data.operational_status` ✓
- `Reservations.tsx`: grava `status: editForm.status` e `operational_status: editForm.status` ✓
- Ambos usam os mesmos 6 status (pending, confirmed, hosted, finished, no-show, cancelled) ✓

### Ação
Sincronização já está implementada. Apenas garantir que o select no `Reservations.tsx` não tenha `completed` residual (remover se existir — confirmei que `getStatusBadge` ainda tem entry para `completed`, posso limpar).

---

## Detalhes Técnicos

| Item | Tipo de mudança | Arquivos |
|------|----------------|----------|
| 1 | Edge Functions (HTML templates) | `send-reservation-email/index.ts`, `send-checkin-email/index.ts` |
| 2 | Migration DB + Function DB + Frontend | Migration SQL, `Checkin.tsx` |
| 3 | Limpeza frontend | `Reservations.tsx` (remover `completed` residual) |

### Impacto
- Nenhuma alteração no fluxo de pagamento
- Nenhuma quebra de funcionalidade existente
- Check-in continua sem exigir login (validação por token)
- Dados FNRH salvos vinculados à reserva via `booking_checkins`

