
## Plano: Correção da Verificação de Conflito de Datas

### Problema Identificado
Ao editar uma reserva manual no calendário, o sistema exibe um alerta de conflito de datas mesmo quando a reserva conflitante está em um **quarto diferente**. O erro impede o salvamento da edição.

### Causa Raiz
A função `checkConflict` no hook `useCalendarReservations.ts` usa uma closure que pode conter dados desatualizados (stale closure). Quando o componente re-renderiza e os dados de reservas são atualizados, a função `checkConflict` passada para os modais pode ainda estar referenciando a versão antiga dos dados.

### Solução Proposta

**Arquivo: `src/hooks/useCalendarReservations.ts`**

1. **Converter `checkConflict` para `useCallback`** com dependências corretas:
   - Adicionar import de `useCallback` do React
   - Envolver a função `checkConflict` com `useCallback`
   - Especificar `reservations` e `blockedDates` como dependências

2. **Adicionar logs de debug** (temporários) para identificar qual reserva está causando o falso positivo

### Alterações Técnicas

```typescript
// ANTES (linha 209-247):
const checkConflict = (
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string
): boolean => {
  // ...
};

// DEPOIS:
const checkConflict = useCallback((
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string
): boolean => {
  // Log para debug
  console.log("🔍 checkConflict chamado:", {
    roomId,
    checkIn: format(checkIn, "yyyy-MM-dd"),
    checkOut: format(checkOut, "yyyy-MM-dd"),
    excludeReservationId,
    totalReservations: reservations.length,
  });

  const roomReservations = reservations.filter(
    (r) => r.room_id === roomId && r.id !== excludeReservationId
  );
  
  console.log("📋 Reservas no mesmo quarto:", roomReservations.map(r => ({
    id: r.id,
    guest: r.guest_name,
    checkIn: r.check_in,
    checkOut: r.check_out
  })));

  const roomBlocks = blockedDates.filter((b) => b.room_id === roomId);

  const checkInStr = format(checkIn, "yyyy-MM-dd");
  const checkOutStr = format(checkOut, "yyyy-MM-dd");

  // Check against existing reservations
  for (const res of roomReservations) {
    const hasConflict = 
      (checkInStr >= res.check_in && checkInStr < res.check_out) ||
      (checkOutStr > res.check_in && checkOutStr <= res.check_out) ||
      (checkInStr <= res.check_in && checkOutStr >= res.check_out);
    
    if (hasConflict) {
      console.log("⚠️ Conflito detectado com:", res);
      return true;
    }
  }

  // Check against blocked dates
  for (const block of roomBlocks) {
    if (
      (checkInStr >= block.start_date && checkInStr <= block.end_date) ||
      (checkOutStr >= block.start_date && checkOutStr <= block.end_date) ||
      (checkInStr <= block.start_date && checkOutStr >= block.end_date)
    ) {
      console.log("🚫 Conflito com bloqueio:", block);
      return true;
    }
  }

  console.log("✅ Sem conflitos");
  return false;
}, [reservations, blockedDates]);
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useCalendarReservations.ts` | Adicionar `useCallback` ao import e envolver `checkConflict` |

### Resultado Esperado
- A função `checkConflict` sempre usará a versão mais atual dos dados de `reservations` e `blockedDates`
- O filtro por `room_id` funcionará corretamente, evitando falsos positivos em quartos diferentes
- Logs de console ajudarão a identificar problemas (podem ser removidos após validação)

### Teste de Validação
1. Abrir uma reserva para edição no calendário
2. Alterar qualquer campo (ex: nome do hóspede)
3. Clicar em "Salvar"
4. Verificar que o salvamento é concluído sem alerta de conflito falso
5. Verificar nos logs do console que a função está filtrando corretamente por `room_id`
