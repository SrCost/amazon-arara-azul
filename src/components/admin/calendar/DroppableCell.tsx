import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { isPast, isToday, isWeekend } from "date-fns";

interface DroppableCellProps {
  roomId: string;
  date: Date;
  onClick: () => void;
}

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
      data-room-id={roomId}
      data-date={date.toISOString()}
      onClick={onClick}
      className={cn(
        "border-b border-r border-border min-h-[60px] cursor-pointer transition-all",
        isPastDay && "bg-muted/30 cursor-not-allowed",
        isToday(date) && "bg-primary/5",
        isWeekend(date) && !isPastDay && "bg-accent/10",
        !isOver && !isPastDay && "hover:bg-accent/20",
        // Feedback visual melhorado durante drag
        isOver && !isPastDay && isDragging && "bg-primary/30 ring-2 ring-primary ring-inset",
        isOver && !isPastDay && !isDragging && "bg-primary/20 ring-2 ring-primary ring-inset"
      )}
    />
  );
};

export default DroppableCell;
