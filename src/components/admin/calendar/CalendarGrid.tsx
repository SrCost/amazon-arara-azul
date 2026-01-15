import { useMemo } from "react";
import { format, eachDayOfInterval, isToday, isPast, isSameDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ReservationBlock from "./ReservationBlock";
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
}: CalendarGridProps) => {
  const days = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  // Calculate grid column positions for reservations
  const getReservationPosition = (
    checkIn: string,
    checkOut: string,
    days: Date[]
  ): { startCol: number; span: number } | null => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    let startCol = days.findIndex((d) => isSameDay(d, checkInDate));
    let endCol = days.findIndex((d) => isSameDay(d, checkOutDate));

    // Adjust for reservations that start before the visible period
    if (startCol === -1 && checkInDate < days[0]) {
      startCol = 0;
    }

    // Adjust for reservations that end after the visible period
    if (endCol === -1 && checkOutDate > days[days.length - 1]) {
      endCol = days.length;
    }

    if (startCol === -1 || endCol === -1) return null;
    if (endCol <= startCol) return null;

    return { startCol: startCol + 1, span: endCol - startCol };
  };

  return (
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
              isToday(day) && "bg-primary/10 font-bold",
              isPast(day) && !isToday(day) && "bg-muted/50 text-muted-foreground",
              isWeekend(day) && "bg-accent/30"
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
                {/* Background cells (clickable) */}
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    onClick={() => onCellClick(room.id, day)}
                    className={cn(
                      "border-b border-r border-border min-h-[60px] cursor-pointer hover:bg-accent/20 transition-colors",
                      isPast(day) && !isToday(day) && "bg-muted/30 cursor-not-allowed",
                      isToday(day) && "bg-primary/5",
                      isWeekend(day) && !isPast(day) && "bg-accent/10"
                    )}
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

                {/* Reservations overlay */}
                {roomReservations.map((reservation) => {
                  const position = getReservationPosition(
                    reservation.check_in,
                    reservation.check_out,
                    days
                  );
                  if (!position) return null;

                  return (
                    <ReservationBlock
                      key={reservation.id}
                      reservation={reservation}
                      startCol={position.startCol}
                      span={position.span}
                      onClick={() => onReservationClick(reservation)}
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
};

export default CalendarGrid;
