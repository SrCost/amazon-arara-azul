
## Plano: Correção Completa do CRUD de Reservas

### Problema 1: Constraint de Status Bloqueando Alterações

**Causa Raiz Identificada:**

A tabela `reservations` tem uma CHECK constraint que permite apenas 4 valores para o campo `status`:
```sql
CHECK (status = ANY (ARRAY['pending', 'confirmed', 'cancelled', 'completed']))
```

Mas o dropdown do modal oferece opções adicionais que o sistema precisa:
- `hosted` (Hospedado)
- `finished` (Finalizado)  
- `no-show` (No-show)

**Solução:** Atualizar a constraint para incluir todos os status operacionais válidos.

```sql
-- Remover constraint antiga
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Criar nova constraint com todos os status válidos
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status = ANY (ARRAY[
  'pending',
  'confirmed', 
  'cancelled',
  'completed',
  'hosted',
  'finished',
  'no-show'
]));
```

---

### Problema 2: Conflito de Datas ao Trocar Bangalô

**Causa Raiz Identificada:**

O `CalendarGrid` usa `new Date(checkIn)` para calcular posições das reservas, causando interpretação UTC e shifts de timezone. Além disso, a função `checkConflict` pode estar comparando strings de datas com formatos inconsistentes.

**Solução:** 
1. Usar `parseDateOnly` consistentemente em `CalendarGrid.tsx`
2. Garantir que a verificação de conflito use as mesmas funções de parsing em todo o fluxo

```typescript
// CalendarGrid.tsx - getReservationPosition
const getReservationPosition = (
  checkIn: string,
  checkOut: string,
  days: Date[]
): { startCol: number; span: number } | null => {
  const checkInDate = parseDateOnly(checkIn);  // Usar parseDateOnly
  const checkOutDate = parseDateOnly(checkOut); // Usar parseDateOnly
  // ... resto da lógica
};
```

---

### Problema 3: Drag-and-Drop Impreciso

**Causa Raiz Identificada:**

O sistema de drag-and-drop do `@dnd-kit/core` está detectando a célula de drop incorreta porque:

1. Os blocos de reserva são `position: absolute` sobre as células, o que pode interferir na detecção
2. A estrutura do grid com `contents` pode causar confusão na hierarquia de elementos
3. O cálculo da posição do drop não leva em conta o offset do scroll horizontal

**Solução:** 
1. Adicionar sensors personalizados com threshold de ativação
2. Usar `closestCenter` ou `closestCorners` como estratégia de colisão
3. Adicionar `pointer-events-none` aos blocos durante o drag para melhorar a detecção das células

```typescript
// CalendarGrid.tsx
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors 
} from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Mínimo de 8px antes de ativar drag
    },
  })
);

// No DndContext
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
```

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| **Database Migration** | Atualizar `reservations_status_check` para incluir `hosted`, `finished`, `no-show` |
| `src/components/admin/calendar/CalendarGrid.tsx` | Usar `parseDateOnly` no cálculo de posições + adicionar sensors e collision detection |
| `src/components/admin/calendar/EditReservationModal.tsx` | Verificar consistência dos valores do dropdown com a constraint |

---

### Detalhes Técnicos

#### 1. Migration SQL (Prioridade Alta)

```sql
-- Atualizar constraint de status
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status = ANY (ARRAY[
  'pending',
  'confirmed', 
  'cancelled',
  'completed',
  'hosted',
  'finished',
  'no-show'
]));

-- Também atualizar payment_status se necessário
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status = ANY (ARRAY[
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled'
]));
```

#### 2. CalendarGrid.tsx Atualizado

```typescript
import { parseDateOnly } from "@/lib/dateOnly";
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent, 
  DragStartEvent 
} from "@dnd-kit/core";

const CalendarGrid = ({ ... }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getReservationPosition = (
    checkIn: string,
    checkOut: string,
    days: Date[]
  ): { startCol: number; span: number } | null => {
    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);
    // ... resto mantido
  };

  // No return com DndContext
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {gridContent}
      <DragOverlay dropAnimation={null}>
        {activeReservation && (
          <DragOverlayContent reservation={activeReservation} />
        )}
      </DragOverlay>
    </DndContext>
  );
};
```

#### 3. Melhoria nas Células Droppable

```typescript
// DroppableCell.tsx - adicionar data-room-id para debug
const DroppableCell = ({ roomId, date, onClick }: DroppableCellProps) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `cell-${roomId}-${date.toISOString()}`,
    data: { roomId, date },
  });

  return (
    <div
      ref={setNodeRef}
      data-room-id={roomId}
      data-date={date.toISOString()}
      onClick={onClick}
      className={cn(
        "border-b border-r border-border min-h-[60px] transition-all",
        // ... classes existentes
        isOver && active && "bg-primary/30 ring-2 ring-primary"
      )}
    />
  );
};
```

---

### Resultado Esperado

| Funcionalidade | Antes | Depois |
|---------------|-------|--------|
| Alterar Status Operacional | ❌ Erro de constraint | ✅ Salva corretamente |
| Trocar Bangalô | ❌ Falso conflito | ✅ Permite troca se disponível |
| Drag-and-Drop | ❌ Impreciso | ✅ Detecta célula correta |
| Editar qualquer campo | ❌ Erros variados | ✅ CRUD completo funcionando |

---

### Histórico/Auditoria

Todas as alterações de reservas continuarão sendo registradas automaticamente pelos triggers de auditoria existentes (`trg_audit_reservations`), incluindo:
- Mudanças de status operacional
- Alterações de bangalô
- Movimentações via drag-and-drop
