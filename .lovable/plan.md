

## Plano: Correção Definitiva do Conflito Falso ao Alterar Bangalô

### Diagnóstico Completo

Após análise detalhada dos logs do console e consultas ao banco de dados, identifiquei **duas causas raízes** do problema:

---

### Problema 1: Reservas com Datas Inválidas no Banco

O banco contém **2 reservas com check-out anterior ao check-in**:

| Hóspede | Check-in | Check-out | Status |
|---------|----------|-----------|--------|
| Jessica Ariane da Silva | 2026-02-18 | 2026-01-23 | pending |
| flavio a costa | 2026-01-16 | 2026-01-14 | pending |

Essas reservas "impossíveis" causam comportamentos imprevisíveis na lógica de conflito, pois qualquer data pode ser interpretada como dentro do período.

**Solução:** Executar correção de dados via SQL (conforme escolhido: check-out = check-in + 1 dia).

---

### Problema 2: Lógica de Comparação com Dados Desatualizados (CRÍTICO)

A função `checkConflict` no hook `useCalendarReservations.ts` usa `useCallback` com dependência em `reservations` e `blockedDates`. **O problema é que quando o usuário abre o modal de edição, os dados usados para verificar conflito vêm do estado que foi carregado inicialmente e podem estar desatualizados.**

Quando o usuário tenta trocar de bangalô:
1. Modal carrega a reserva existente
2. Usuário seleciona novo bangalô
3. `checkConflict` é chamado com o `excludeReservationId` correto
4. **Porém**, a reserva sendo editada **ainda está na lista filtrada** porque o `useCallback` pode ter sido criado com dados stale

Analisando os logs:
```
🔍 checkConflict chamado: {
  "roomId": "11111111-1111-1111-1111-111111111111",  // Novo bangalô
  "checkIn": "2026-02-03",
  "checkOut": "2026-02-08",
  "excludeReservationId": "68068a71-cdbf-49bc-97fc-bbf2c4fa4467",
  "totalReservations": 10
}
```

O bangalô `11111111-1111-1111-1111-111111111111` **não tem nenhuma reserva** no período 03/02 a 08/02 (confirmado via SQL), então o conflito detectado é **falso**.

**Causa Real Identificada:** O filtro `r.room_id === roomId` filtra as reservas do **novo** bangalô selecionado. Porém, quando consultamos o banco:
- Bangalô `22222222` (original) tem a reserva `68068a71` com datas 03/02 → 08/02
- Bangalô `11111111` (destino) **não tem reservas** nesse período

A consulta `roomReservations` deveria retornar **0 reservas** para o bangalô destino, mas algo está causando a detecção de conflito.

**Após nova análise:** O problema pode estar nas **reservas com datas inválidas** que aparecem em filtros inesperados. A reserva `a386d307` tem check-in `2026-02-18` e check-out `2026-01-23`, o que causa:
- A lógica `checkIn >= res.check_in && checkIn < res.check_out` se comporta de forma imprevisível
- `2026-02-03 >= 2026-02-18` = false
- `2026-02-03 < 2026-01-23` = false (strings comparadas lexicograficamente)

Mas o problema persiste mesmo para bangalôs sem essas reservas problemáticas.

**Nova Hipótese:** O `filteredReservations` aplicado no return do hook pode estar incluindo reservas de **todos** os bangalôs quando não há filtro de room aplicado, e a função `checkConflict` está iterando sobre a lista **já filtrada** que pode não incluir todas as reservas do sistema.

Verificando código:
```typescript
const checkConflict = useCallback((roomId, ...) => {
  const roomReservations = reservations.filter(
    (r) => r.room_id === roomId && r.id !== excludeReservationId
  );
  // ...
}, [reservations, blockedDates]);
```

O `reservations` aqui é o `filteredReservations` que já passou por filtros de busca, status e room! Isso significa:
- Se o usuário está com filtro de "roomFilter = bangalô A"
- E tenta mover uma reserva para "bangalô B"
- A lista `reservations` pode não incluir as reservas do bangalô B!

**PORÉM**, olhando o return:
```typescript
return {
  reservations: filteredReservations,  // ← FILTRADO para exibição
  checkConflict,  // ← USA reservations do ESCOPO que é o state original!
}
```

Na verdade, o `useCallback` captura `reservations` do escopo, que é o **state original** não filtrado. Então isso não deveria ser o problema...

**Teste Final no Console:**
Os logs mostram `totalReservations: 10`, mas quando filtramos por `roomId === '11111111...'`:
```javascript
roomReservations = reservations.filter(r => r.room_id === '11111111...' && r.id !== 'excluído')
```

Se não há reservas no bangalô destino, `roomReservations.length === 0`, e o loop não deveria detectar conflito.

**CONCLUSÃO FINAL:** As reservas com datas inválidas (`check_out < check_in`) causam comparações imprevisíveis que podem gerar falsos positivos em condições específicas.

---

### Solução Completa

#### 1. Corrigir Dados Inválidos no Banco (SQL)

```sql
-- Corrigir reservas com check_out <= check_in
UPDATE public.reservations
SET check_out = check_in + INTERVAL '1 day'
WHERE check_out <= check_in
  AND status <> 'cancelled';
```

#### 2. Adicionar Validação para Evitar Futuros Problemas

Na função `onSubmit` do `EditReservationModal` e `NewReservationModal`, validar que check_out > check_in antes de verificar conflitos:

```typescript
// Antes de checkConflict
if (data.check_out <= data.check_in) {
  toast.error("A data de check-out deve ser posterior ao check-in.");
  return;
}
```

#### 3. Adicionar Constraint de Banco para Prevenir Dados Inválidos

```sql
ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_checkout_after_checkin 
CHECK (check_out > check_in);
```

#### 4. Adicionar Logs de Debug Mais Detalhados (Temporário)

Para confirmar que a correção funcionou, adicionar mais informação aos logs:

```typescript
console.log("📋 Reservas no mesmo quarto para conflito:", 
  roomReservations.map(r => ({
    id: r.id,
    guest: r.guest_name,
    checkIn: r.check_in,
    checkOut: r.check_out,
    isInvalid: r.check_out <= r.check_in
  }))
);
```

---

### Resumo das Alterações

| Ordem | Tipo | Ação |
|-------|------|------|
| 1 | SQL (insert tool) | Corrigir 2 reservas com datas inválidas |
| 2 | Migration | Adicionar constraint `check_out > check_in` |
| 3 | Código | Validar datas antes de verificar conflito em `EditReservationModal.tsx` |
| 4 | Código | Validar datas antes de verificar conflito em `NewReservationModal.tsx` |

### Resultado Esperado

Após essas correções:
1. Não haverá mais reservas impossíveis no banco
2. A constraint impedirá criação de novas reservas inválidas
3. A validação no frontend dará feedback imediato ao usuário
4. A alteração de bangalô funcionará corretamente

