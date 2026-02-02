import { useMemo, useState } from "react";
import { format, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DndContext, 
  DragOverlay, 
  DragEndEvent, 
  DragStartEvent,
  pointerWithin,
  closestCenter,
  CollisionDetection,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { parseDateOnly } from "@/lib/dateOnly";
import DraggableReservationBlock from "./DraggableReservationBlock";
import DroppableCell from "./DroppableCell";
import DragOverlayContent from "./DragOverlayContent";
import BlockedBlock from "./BlockedBlock";
import type { CalendarReservation, BlockedDate, Room } from "@/hooks/useCalendarReservations";

interface CalendarGridProps {
  monthStart: Date;
  monthEnd: Date;
  rooms: Room[];
  reservationsByRoom: Record<string, CalendarReservation[]>;
  blockedByRoom: Record<string, BlockedDate[]>;
  onCellClick: (roomId: string, date: Date) => void;
  onReservationClick: (reservation: CalendarReservation) => void;
  onBlockClick: (block: BlockedDate) => void;
  onReservationMove?: (reservationId: string, newRoomId: string, newCheckIn: Date) => void;
  isDragEnabled?: boolean;
}

const CalendarGrid = ({
  monthStart,
  monthEnd,
  rooms,
  reservationsByRoom,
  blockedByRoom,
  onCellClick,
  onReservationClick,
  onBlockClick,
  onReservationMove,
  isDragEnabled = false,
}: CalendarGridProps) => {
  const [activeReservation, setActiveReservation] = useState<CalendarReservation | null>(null);

  // Estratégia de colisão híbrida: pointerWithin (preciso) com fallback para closestCenter
  const customCollisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  };

  // Sensors para drag-and-drop com threshold de ativação
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Mínimo de 8px antes de ativar drag
      },
    })
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  // Calculate grid column positions for reservations using parseDateOnly for timezone safety
  const getReservationPosition = (
    checkIn: string,
    checkOut: string,
    days: Date[]
  ): { startCol: number; span: number } | null => {
    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);
    
    let startCol = days.findIndex((d) => isSameDay(d, checkInDate));
    let endCol = days.findIndex((d) => isSameDay(d, checkOutDate));

    if (startCol === -1 && checkInDate < days[0]) {
      startCol = 0;
    }

    if (endCol === -1 && checkOutDate > days[days.length - 1]) {
      endCol = days.length;
    }

    if (startCol === -1 || endCol === -1) return null;
    if (endCol <= startCol) return null;

    return { startCol: startCol + 1, span: endCol - startCol };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const reservation = event.active.data.current?.reservation as CalendarReservation;
    if (reservation) {
      setActiveReservation(reservation);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveReservation(null);

    const { active, over } = event;
    if (!over || !onReservationMove) return;

    const reservation = active.data.current?.reservation as CalendarReservation;
    const dropData = over.data.current as { roomId: string; date: Date } | undefined;

    if (reservation && dropData) {
      onReservationMove(reservation.id, dropData.roomId, dropData.date);
    }
  };

  const handleDragCancel = () => {
    setActiveReservation(null);
  };

  const gridContent = (
    <div className="overflow-x-auto border border-border rounded-lg bg-card">
      <div
        className="min-w-[1400px]"
        style={{
          display: "grid",
          gridTemplateColumns: `160px repeat(${days.length}, minmax(50px, 1fr))`,
        }}
      >
        {/* Header Row - Days */}
        <div className="sticky left-0 z-20 bg-muted border-b border-r border-border p-2 font-medium text-sm">
          Bangalô
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "border-b border-r border-border py-1 px-0.5 text-center",
              isToday(day) && "bg-primary/10 font-bold"
            )}
          >
            <div className="text-[10px] font-medium uppercase text-muted-foreground">
              {format(day, "EEEEE", { locale: ptBR })}
            </div>
            <div className={cn(
              "text-sm font-semibold",
              isToday(day) && "text-primary"
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}

        {/* Room Rows */}
        {rooms.map((room) => {
          const roomReservations = reservationsByRoom[room.id] || [];
          const roomBlocks = blockedByRoom[room.id] || [];

          return (
            <div key={room.id} className="contents">
              {/* Room Name */}
              <div className="sticky left-0 z-10 bg-card border-b border-r border-border p-2">
                <div className="font-medium text-sm truncate" title={room.name_pt}>
                  {room.name_pt}
                </div>
                <div className="text-xs text-muted-foreground">
                  Até {room.max_guests} pessoas
                </div>
              </div>

              {/* Day Cells with Reservations/Blocks overlay */}
              <div
                className="relative col-span-full grid"
                style={{
                  gridColumn: `2 / -1`,
                  gridTemplateColumns: `repeat(${days.length}, minmax(50px, 1fr))`,
                }}
              >
                {/* Background cells (droppable) */}
                {days.map((day) => (
                  <DroppableCell
                    key={day.toISOString()}
                    roomId={room.id}
                    date={day}
                    onClick={() => onCellClick(room.id, day)}
                  />
                ))}

                {/* Blocked dates overlay */}
                {roomBlocks.map((block) => {
                  const position = getReservationPosition(block.start_date, block.end_date, days);
                  if (!position) return null;

                  return (
                    <BlockedBlock
                      key={block.id}
                      block={block}
                      startCol={position.startCol}
                      span={position.span}
                      onClick={() => onBlockClick(block)}
                    />
                  );
                })}

                {/* Reservations overlay (draggable) */}
                {roomReservations.map((reservation) => {
                  const position = getReservationPosition(
                    reservation.check_in,
                    reservation.check_out,
                    days
                  );
                  if (!position) return null;

                  return (
                    <DraggableReservationBlock
                      key={reservation.id}
                      reservation={reservation}
                      startCol={position.startCol}
                      span={position.span}
                      onClick={() => onReservationClick(reservation)}
                      isDragEnabled={isDragEnabled}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isDragEnabled) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
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
  }

  return gridContent;
};

export default CalendarGrid;
