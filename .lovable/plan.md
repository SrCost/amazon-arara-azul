## Correções no Calendário de Reservas (PMS)

### 1. Marcação visual do dia de check-out
**Problema:** Reserva de 04/08 a 07/08 aparece pintada apenas em 04, 05 e 06. O dia 07 (check-out) fica sem a marcação amarela, o que confunde a operação.

**Causa:** Em `src/components/admin/calendar/CalendarGrid.tsx` (função `getReservationPosition`), o `span` é calculado como `endCol - startCol`, ou seja, exclui a célula do check-out.

**Correção:** Ajustar o cálculo para incluir o dia de check-out na barra visual (`span = endCol - startCol + 1`, com clamp ao fim do mês quando aplicável). O mesmo ajuste será aplicado para bloqueios, que hoje compartilham a mesma função.

**Importante:** A mudança é **apenas visual**. A regra de hospitalidade que permite novo check-in no mesmo dia de um check-out (`checkConflict` em `useCalendarReservations` e função `get_room_availability`) **não será alterada** — continuam liberando a célula para reserva subsequente, como hoje.

### 2. Campo "Quantidade de Pessoas" travado com pacote Gavião Panema
**Problema:** Ao selecionar o pacote Gavião Panema na tela de Nova Reserva, o seletor de hóspedes fica desabilitado, contrariando a regra de pacote personalizado (datas e nº de pessoas livres).

**Causa:** Em `src/components/admin/calendar/NewReservationModal.tsx` (linha 401), o `Select` de `guests` usa `disabled={!!selectedPackage}` em vez de `disabled={lockedByPackage}`. O `EditReservationModal` já está correto.

**Correção:** Trocar para `disabled={lockedByPackage}`, alinhando com o comportamento das datas e com o modal de edição.

### Arquivos afetados
- `src/components/admin/calendar/CalendarGrid.tsx` — ajuste de `span` em `getReservationPosition`.
- `src/components/admin/calendar/NewReservationModal.tsx` — trocar `disabled` do campo `guests`.

### Validação
- Criar/abrir uma reserva 04→07 e confirmar 4 células pintadas (04, 05, 06, 07).
- Selecionar Gavião Panema em Nova Reserva e confirmar que o seletor de pessoas fica habilitado.
- Verificar que ainda é possível criar uma nova reserva começando no dia de check-out de outra (sem conflito).
