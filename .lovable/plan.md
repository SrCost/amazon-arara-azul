
# Botao de Envio de Email Manual nas Reservas

## Problema
Atualmente, o email de confirmacao e disparado automaticamente ao criar uma reserva manual. Isso pode causar envio de emails incorretos para hospedes que ja passaram pela pousada (reservas retroativas sendo cadastradas no sistema).

## Solucao

Remover o envio automatico de email do `NewReservationModal` e adicionar um botao "Enviar Email" no `EditReservationModal`, permitindo que o admin envie o email de confirmacao manualmente quando desejar.

## Alteracoes

### 1. `src/components/admin/calendar/NewReservationModal.tsx`
- Remover o bloco de codigo (linhas 272-292) que envia email automaticamente apos criar a reserva
- Manter apenas o toast de sucesso da criacao

### 2. `src/components/admin/calendar/EditReservationModal.tsx`
- Adicionar estado `isSendingEmail` para controlar o loading do botao
- Adicionar funcao `handleSendEmail` que invoca `supabase.functions.invoke('send-reservation-email')` com os dados da reserva atual
- Adicionar botao "Enviar Email de Confirmacao" (com icone `Mail` do lucide-react) na area de acoes do modal de edicao
- O botao ficara na barra de acoes junto com "Salvar" e "Excluir"
- Exibir toast de sucesso/erro conforme resultado do envio
- O botao so aparece quando a reserva tem `guest_email` preenchido

### Detalhes tecnicos

O botao chamara:
```
supabase.functions.invoke('send-reservation-email', {
  body: {
    type: 'reservation_confirmed',
    reservationId: reservation.id,
    email: reservation.guest_email,
    name: reservation.guest_name,
  }
})
```

Nenhuma alteracao na edge function e necessaria - ela ja suporta esse payload.
