
# Corrigir persistencia de Diaria e Total ao editar reservas

## Problema raiz

Quando o `EditReservationModal` carrega uma reserva do banco, ele faz:
1. Define `manualDailyRate = null` e `manualTotal = null` (reset)
2. Define `data.daily_rate` com o valor salvo no banco (ex: R$ 100)
3. Calcula `dailyRate` usando `getDailyRate(guests, data.daily_rate)` que aplica o **multiplicador de hospedes** (ex: 1.596x para 2 hospedes)
4. Resultado: a diaria exibida vira R$ 159,60 em vez de R$ 100

O mesmo acontece com o total: como a diaria foi recalculada, o total tambem muda.

## Solucao

Ao carregar uma reserva existente, tratar os valores do banco (`daily_rate` e `total_price`) como **overrides manuais**, pois representam os valores que o admin efetivamente salvou.

## Alteracao

### `src/components/admin/calendar/EditReservationModal.tsx`

Nas linhas 173-177, ao resetar os overrides manuais, em vez de setar `null`, usar os valores da reserva:

**De:**
```typescript
setManualDailyRate(null);
setManualTotal(null);
setEditingDailyRate(false);
setEditingTotal(false);
```

**Para:**
```typescript
setManualDailyRate(reservation.daily_rate ?? null);
setManualTotal(reservation.total_price ?? null);
setEditingDailyRate(false);
setEditingTotal(false);
```

Isso garante que ao abrir o modal de edicao, a diaria e o total exibidos sao exatamente os valores salvos no banco. O admin ainda pode clicar no icone de lapis para editar, e ao salvar, os valores persistem corretamente (ja corrigido anteriormente com `daily_rate: dailyRate` e `total_price: totalPrice`).

Nenhuma outra alteracao e necessaria - o `NewReservationModal` nao tem esse problema pois cria reservas novas sem valores pre-existentes.
