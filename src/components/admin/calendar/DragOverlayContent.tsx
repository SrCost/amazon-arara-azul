import { User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarReservation } from "@/hooks/useCalendarReservations";

interface DragOverlayContentProps {
  reservation: CalendarReservation;
}

const DragOverlayContent = ({ reservation }: DragOverlayContentProps) => {
  return (
    <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-2xl border-2 border-primary-foreground/20 min-w-[200px]">
      <div className="flex items-center gap-2 font-bold text-sm">
        <User className="h-4 w-4" />
        {reservation.guest_name}
      </div>
      <div className="text-xs opacity-90 mt-1">
        {reservation.guests} pessoa(s)
      </div>
      <div className="text-xs opacity-80 mt-1 flex items-center gap-2">
        <span>{format(new Date(reservation.check_in), "dd/MM", { locale: ptBR })}</span>
        <span>→</span>
        <span>{format(new Date(reservation.check_out), "dd/MM", { locale: ptBR })}</span>
      </div>
      <div className="text-xs mt-2 font-medium bg-primary-foreground/20 rounded px-2 py-1">
        Solte para mover
      </div>
    </div>
  );
};

export default DragOverlayContent;
