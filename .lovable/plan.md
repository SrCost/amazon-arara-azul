
# Corrigir persistencia de precos no modal de edicao de reservas

## Problema raiz

Ao carregar uma reserva existente no `EditReservationModal`, o campo `daily_rate` do formulario recebe o valor JA CALCULADO da reserva (ex: R$ 99). Esse valor e passado para `getDailyRate(guests, 99)` que aplica o multiplicador de hospedes NOVAMENTE (99 x 1.596 = R$ 158). Mesmo com a correcao anterior de `manualDailyRate`, a dupla aplicacao do multiplicador causa inconsistencias:

1. Ao clicar no botao X (cancelar override manual), `manualDailyRate` volta a `null` e o valor exibido pula para o duplamente multiplicado
2. Qualquer mudanca no numero de hospedes recalcula com base errada

## Solucao

Duas alteracoes no `EditReservationModal.tsx`:

### 1. Corrigir `daily_rate` no form.reset (linha 187)

Usar o preco base do QUARTO (`room?.price_per_night`) em vez do `reservation.daily_rate` (que ja tem multiplicador aplicado). Isso garante que `getDailyRate()` calcule corretamente quando nao ha override manual.

**De:**
```
daily_rate: reservation.daily_rate || room?.price_per_night || 1500,
```

**Para:**
```
daily_rate: room?.price_per_night || 1500,
```

### 2. Corrigir botao X (cancelar override) para resetar ao valor do banco (linhas 640-643 e 709-712)

Em vez de resetar `manualDailyRate` e `manualTotal` para `null` (que expoe o calculo automatico com base potencialmente errada), resetar para os valores originais da reserva.

**Diaria - De:**
```typescript
onClick={() => {
  setManualDailyRate(null);
  setEditingDailyRate(false);
}}
```

**Para:**
```typescript
onClick={() => {
  setManualDailyRate(reservation?.daily_rate ?? null);
  setEditingDailyRate(false);
}}
```

**Total - De:**
```typescript
onClick={() => {
  setManualTotal(null);
  setEditingTotal(false);
}}
```

**Para:**
```typescript
onClick={() => {
  setManualTotal(reservation?.total_price ?? null);
  setEditingTotal(false);
}}
```

## Resultado esperado

- Ao abrir uma reserva existente, os valores de diaria e total serao exatamente os salvos no banco
- Ao cancelar uma edicao manual (botao X), os valores voltam ao que estava salvo (nao recalcula)
- Ao salvar, os valores persistem corretamente sem modificacao
- Mudancas no numero de hospedes so afetam o calculo quando nao ha override manual

## Arquivo alterado

- `src/components/admin/calendar/EditReservationModal.tsx` (3 alteracoes pontuais)
