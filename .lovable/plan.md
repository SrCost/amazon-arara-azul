
# Remover campo "Tarifa Base" dos modais de reserva

## Problema
O campo "Tarifa Base (R$)" esta causando confusao ao registrar reservas manuais. O admin ve tres campos de preco (Tarifa Base, Diaria Calculada, Total) quando so precisa de dois: a diaria e o total.

## Solucao
Remover o campo "Tarifa Base (R$)" da interface dos dois modais (criacao e edicao de reserva), mantendo apenas "Diaria Calculada" e "Total". A tarifa base continuara sendo usada internamente para os calculos, mas nao sera exibida ao usuario.

## Alteracoes

### 1. `src/components/admin/calendar/EditReservationModal.tsx`
- Remover o bloco `FormField` de "Tarifa Base (R$)" (linhas 596-619)
- Alterar o grid de 3 colunas para 2 colunas: `grid-cols-1 md:grid-cols-3` para `grid-cols-1 md:grid-cols-2`

### 2. `src/components/admin/calendar/NewReservationModal.tsx`
- Remover o bloco `FormField` de "Tarifa Base (R$)" (linhas 558-579)
- Alterar o grid de 3 colunas para 2 colunas: `grid-cols-1 md:grid-cols-3` para `grid-cols-1 md:grid-cols-2`

O campo `daily_rate` permanece no formulario internamente (com valor default do banco), apenas a exibicao e removida. Nenhuma logica de calculo e afetada.
