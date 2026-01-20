import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { isPast, isToday, isWeekend } from "date-fns";

interface DroppableCellProps {
  roomId: string;
  date: Date;
  onClick: () => void;
}

const DroppableCell = ({ roomId, date, onClick }: DroppableCellProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${roomId}-${date.toISOString()}`,
    data: { roomId, date },
  });

  const isPastDay = isPast(date) && !isToday(date);

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "border-b border-r border-border min-h-[60px] cursor-pointer transition-all",
        isPastDay && "bg-muted/30 cursor-not-allowed",
        isToday(date) && "bg-primary/5",
        isWeekend(date) && !isPastDay && "bg-accent/10",
        !isOver && !isPastDay && "hover:bg-accent/20",
        isOver && !isPastDay && "bg-primary/20 ring-2 ring-primary ring-inset"
      )}
    />
  );
};

export default DroppableCell;
