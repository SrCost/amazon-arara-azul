import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Phone, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateOnly } from "@/lib/dateOnly";
import type { CalendarReservation } from "@/hooks/useCalendarReservations";

interface ReservationBlockProps {
  reservation: CalendarReservation;
  startCol: number;
  span: number;
  onClick: () => void;
}

const getStatusColor = (status: string | null, paymentStatus: string | null) => {
  // Payment status takes visual priority for pending payments
  if (paymentStatus === "pending") {
    return "bg-amber-500/90 border-amber-600 text-white";
  }
  if (paymentStatus === "failed") {
    return "bg-red-500/90 border-red-600 text-white";
  }

  // Operational status colors
  switch (status) {
    case "confirmed":
      return "bg-emerald-500/90 border-emerald-600 text-white";
    case "hosted":
    case "hospedado":
      return "bg-blue-500/90 border-blue-600 text-white";
    case "finished":
    case "finalizado":
      return "bg-slate-500/90 border-slate-600 text-white";
    case "pending":
      return "bg-amber-400/90 border-amber-500 text-amber-950";
    case "cancelled":
    case "cancelado":
      return "bg-red-400/90 border-red-500 text-white line-through";
    case "no-show":
      return "bg-purple-500/90 border-purple-600 text-white";
    default:
      return "bg-sky-500/90 border-sky-600 text-white";
  }
};

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case "confirmed":
      return "Confirmado";
    case "hosted":
    case "hospedado":
      return "Hospedado";
    case "finished":
    case "finalizado":
      return "Finalizado";
    case "pending":
      return "Pendente";
    case "cancelled":
    case "cancelado":
      return "Cancelado";
    case "no-show":
      return "No-show";
    default:
      return status || "Pendente";
  }
};

const getPaymentLabel = (status: string | null) => {
  switch (status) {
    case "paid":
      return "Pago";
    case "pending":
      return "Pgto Pendente";
    case "failed":
      return "Pgto Falhou";
    case "refunded":
      return "Reembolsado";
    default:
      return status || "Pendente";
  }
};

const getSourceLabel = (source: string | null) => {
  switch (source) {
    case "site":
      return "Site Oficial";
    case "whatsapp":
      return "WhatsApp";
    case "booking":
      return "Booking.com";
    case "airbnb":
      return "Airbnb";
    case "agency":
      return "Agência";
    case "manual":
      return "Manual";
    default:
      return source || "Site";
  }
};

// Helper to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper to get first name
const getFirstName = (name: string): string => {
  return name.trim().split(" ")[0];
};

const ReservationBlock = ({
  reservation,
  startCol,
  span,
  onClick,
}: ReservationBlockProps) => {
  const statusColor = getStatusColor(
    reservation.operational_status || reservation.status,
    reservation.payment_status
  );

  // Determine display based on span width
  const renderContent = () => {
    if (span <= 1) {
      // Very narrow: just initials
      return (
        <div className="font-bold text-[10px] text-center">
          {getInitials(reservation.guest_name)}
        </div>
      );
    } else if (span === 2) {
      // Narrow: first name only
      return (
        <div className="font-medium text-[10px] truncate">
          {getFirstName(reservation.guest_name)}
        </div>
      );
    } else if (span <= 4) {
      // Medium: first name + guests
      return (
        <>
          <div className="font-medium text-xs truncate">
            {getFirstName(reservation.guest_name)}
          </div>
          <div className="text-[9px] opacity-90">
            {reservation.guests}p
          </div>
        </>
      );
    } else {
      // Wide: full info
      return (
        <>
          <div className="font-medium text-xs truncate">
            {reservation.guest_name}
          </div>
          <div className="text-[10px] opacity-90">
            {reservation.guests}p · R$ {(reservation.total_price || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </div>
        </>
      );
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={onClick}
          className={cn(
            "absolute top-1 bottom-1 rounded-md border-l-4 px-1.5 py-0.5 cursor-pointer",
            "flex flex-col justify-center overflow-hidden",
            "hover:scale-[1.02] hover:shadow-lg transition-all z-10",
            statusColor
          )}
          style={{
            gridColumn: `${startCol} / span ${span}`,
            left: "1px",
            right: "1px",
          }}
        >
          {renderContent()}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2 p-1">
          <div className="font-bold text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            {reservation.guest_name}
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Check-in:
            </div>
            <div>{format(parseDateOnly(reservation.check_in), "dd/MM/yyyy", { locale: ptBR })}</div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Check-out:
            </div>
            <div>{format(parseDateOnly(reservation.check_out), "dd/MM/yyyy", { locale: ptBR })}</div>
            
            <div className="text-muted-foreground">Hóspedes:</div>
            <div>{reservation.guests} pessoa(s)</div>
            
            <div className="text-muted-foreground">Status:</div>
            <div className="font-medium">
              {getStatusLabel(reservation.operational_status || reservation.status)}
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              Pagamento:
            </div>
            <div className={cn(
              "font-medium",
              reservation.payment_status === "paid" && "text-emerald-600",
              reservation.payment_status === "pending" && "text-amber-600",
              reservation.payment_status === "failed" && "text-red-600"
            )}>
              {getPaymentLabel(reservation.payment_status)}
            </div>
            
            <div className="text-muted-foreground">Origem:</div>
            <div>{getSourceLabel(reservation.reservation_source)}</div>
            
            <div className="text-muted-foreground">Total:</div>
            <div className="font-bold">
              R$ {reservation.total_price?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {reservation.guest_phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground border-t pt-1">
              <Phone className="h-3 w-3" />
              {reservation.guest_phone}
            </div>
          )}

          {reservation.operational_notes && (
            <div className="text-xs border-t pt-1 text-muted-foreground italic">
              Obs: {reservation.operational_notes}
            </div>
          )}

          <div className="text-[10px] text-muted-foreground border-t pt-1">
            Clique para editar
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default ReservationBlock;
