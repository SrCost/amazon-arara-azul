

# Plano: Melhorar o Modo Arrastar no Calendário de Reservas

## Diagnóstico do Problema

O sistema de drag-and-drop atual usa a estratégia de colisão `closestCenter`, que calcula a distância do **centro** do elemento arrastado até o **centro** de cada célula droppable. Em um grid de calendário com muitas células pequenas, isso causa imprecisão porque:

1. Quando você arrasta uma reserva (que pode ocupar 3-5 dias), o centro da reserva pode estar longe do ponteiro do mouse
2. O algoritmo seleciona a célula cujo centro está mais próximo do centro do elemento arrastado, não onde o mouse está
3. Isso resulta no "pulo" para células incorretas, especialmente ao mover entre linhas (bangalôs)

## Solução Proposta

### 1. Mudar Estratégia de Colisão para `pointerWithin`

A estratégia `pointerWithin` detecta colisão baseada na posição real do **ponteiro do mouse**, não no centro do elemento. Isso é muito mais intuitivo para calendários.

```typescript
// CalendarGrid.tsx - Alteração
import { pointerWithin } from "@dnd-kit/core";

// Em vez de:
collisionDetection={closestCenter}

// Usar:
collisionDetection={pointerWithin}
```

### 2. Adicionar Feedback Visual Aprimorado Durante o Arraste

Melhorar o DroppableCell para mostrar claramente qual célula será selecionada:

- Aumentar o destaque visual da célula sob o ponteiro
- Mostrar indicador da data que será usada como novo check-in
- Adicionar transição suave

### 3. Melhorar o DragOverlay

Adicionar ao componente DragOverlay:
- Mostrar a data de destino atual enquanto arrasta
- Indicar visualmente se o drop é permitido ou bloqueado

### 4. Implementar Fallback de Colisão Customizado

Caso `pointerWithin` não encontre colisão (mouse fora da área), usar `closestCenter` como fallback:

```typescript
import { pointerWithin, closestCenter, CollisionDetection } from "@dnd-kit/core";

const customCollisionDetection: CollisionDetection = (args) => {
  // Primeiro, tenta pointerWithin (mais preciso)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  // Fallback para closestCenter se o ponteiro está fora
  return closestCenter(args);
};
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `CalendarGrid.tsx` | Implementar estratégia de colisão customizada com `pointerWithin` + fallback |
| `DroppableCell.tsx` | Melhorar feedback visual com indicador de data |
| `DragOverlayContent.tsx` | Adicionar informação de destino em tempo real (opcional) |

---

## Detalhes Técnicos

### CalendarGrid.tsx

```typescript
import { 
  DndContext, 
  DragOverlay, 
  DragEndEvent, 
  DragStartEvent,
  DragMoveEvent,
  pointerWithin,
  closestCenter,
  CollisionDetection,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";

// Estratégia de colisão híbrida: pointerWithin com fallback
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCenter(args);
};

// No DndContext:
<DndContext
  sensors={sensors}
  collisionDetection={customCollisionDetection}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
```

### DroppableCell.tsx

Adicionar indicador visual da data quando está em hover:

```typescript
const DroppableCell = ({ roomId, date, onClick }: DroppableCellProps) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `cell-${roomId}-${date.toISOString()}`,
    data: { roomId, date },
  });

  const isPastDay = isPast(date) && !isToday(date);
  const isDragging = !!active;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "border-b border-r border-border min-h-[60px] relative",
        // ... estilos existentes ...
        isOver && !isPastDay && isDragging && "bg-primary/30 ring-2 ring-primary ring-inset",
      )}
    >
      {/* Indicador de data quando hover durante drag */}
      {isOver && isDragging && !isPastDay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">
            {format(date, "dd/MM")}
          </span>
        </div>
      )}
    </div>
  );
};
```

---

## Benefícios

1. **Precisão**: O drop ocorre exatamente onde o mouse está, não onde o centro do elemento arrastado está
2. **Feedback claro**: Usuário vê exatamente qual data será selecionada como novo check-in
3. **Robustez**: Fallback para `closestCenter` evita problemas quando o mouse sai da área do grid
4. **Experiência intuitiva**: Comportamento previsível que segue o cursor

## Resultado Esperado

Ao arrastar uma reserva:
1. A célula diretamente sob o cursor será destacada
2. Um indicador mostrará a data (ex: "05/02") na célula alvo
3. Ao soltar, a reserva será movida para a data correta
4. A duração da reserva será mantida (mesmo número de noites)

