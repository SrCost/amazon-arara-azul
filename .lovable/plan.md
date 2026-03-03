

# Plano: Unificar Status + Corrigir Envio de Email Manual

## Problema 1: Status duplicado e inconsistente

O calendário (`/admin/calendario-reservas`) usa "Status Operacional" com valores: pending, confirmed, hosted, finished, no-show, cancelled.

A tela de reservas (`/admin/reservations`) usa "Status da Reserva" com valores diferentes: pending, confirmed, **completed**, cancelled — faltam hosted, finished e no-show, e usa "completed" em vez de "finished".

Ambos gravam nos campos `status` e `operational_status` simultaneamente, mas com opções desalinhadas.

### Correção
1. **Reservations.tsx** — Unificar o select de "Status da Reserva" para usar as mesmas opções do calendário:
   - pending → Pendente
   - confirmed → Confirmado
   - hosted → Hospedado
   - finished → Finalizado
   - no-show → No-show
   - cancelled → Cancelado
   - Remover "completed" (substituir por "finished")

2. **Reservations.tsx** — No `handleUpdateReservation`, garantir que `operational_status` e `status` recebam o mesmo valor (já faz isso: `operational_status: editForm.status`).

3. **Reservations.tsx** — Atualizar `getStatusBadge` para incluir os novos status (hosted, finished, no-show).

---

## Problema 2: Email manual não envia

Os logs da Edge Function `send-reservation-email` estão vazios, indicando que a requisição nem chega ao servidor. A causa provável é **CORS**: os headers da função usam uma lista antiga sem os headers `x-supabase-client-platform*` e `x-supabase-client-runtime*` que o SDK Supabase atual envia. O preflight (OPTIONS) falha silenciosamente no browser.

### Correção
Atualizar os `corsHeaders` em `send-reservation-email/index.ts` para incluir os headers modernos do SDK:
```
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

---

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/Reservations.tsx` | Alinhar opções de status, atualizar badges |
| `supabase/functions/send-reservation-email/index.ts` | Atualizar CORS headers |

