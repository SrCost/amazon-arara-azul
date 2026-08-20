import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Ban, Wrench, Home, Calendar, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateOnly } from "@/lib/dateOnly";
import type { BlockedDate } from "@/hooks/useCalendarReservations";

interface BlockedBlockProps {
  block: BlockedDate;
  startCol: number;
  span: number;
  onClick: () => void;
}

const getBlockTypeInfo = (blockType: string | null) => {
  switch (blockType) {
    case "maintenance":
      return {
        icon: Wrench,
        label: "Manutenção",
        color: "bg-slate-400/80 border-slate-500",
      };
    case "owner_use":
      return {
        icon: Home,
        label: "Uso da Família",
        color: "bg-indigo-400/80 border-indigo-500",
      };
    case "exclusive":
      return {
        icon: Star,
        label: "Reserva Exclusiva",
        color: "bg-amber-400/80 border-amber-500",
      };
    case "event":
      return {
        icon: Calendar,
        label: "Evento",
        color: "bg-purple-400/80 border-purple-500",
      };
    default:
      return {
        icon: Ban,
        label: "Bloqueado",
        color: "bg-gray-400/80 border-gray-500",
      };
  }
};

const BlockedBlock = ({
  block,
  startCol,
  span,
  startHalf = false,
  endHalf = false,
  lane = 0,
  laneCount = 1,
  onClick,
}: BlockedBlockProps) => {
  const { icon: Icon, label, color } = getBlockTypeInfo(block.block_type);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={onClick}
          className={cn(
            "absolute rounded-md border-l-4 px-2 py-1 cursor-pointer",
            "flex items-center gap-1 overflow-hidden",
            "hover:scale-[1.02] hover:shadow-lg transition-all z-10",
            "text-white",
            color
          )}
          style={{
            gridColumn: `${startCol} / span ${span}`,
            left: startHalf ? `calc(${50 / span}% + 2px)` : "2px",
            right: endHalf ? `calc(${50 / span}% + 2px)` : "2px",
            top: `calc(${(lane * 100) / laneCount}% + 4px)`,
            height: `calc(${100 / laneCount}% - 8px)`,
          }}
        >
          <Icon className="h-3 w-3 flex-shrink-0" />
          {span > 2 && (
            <span className="text-xs font-medium truncate">{label}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2 p-1">
          <div className="font-bold text-sm flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="text-muted-foreground">Início:</div>
            <div>{format(parseDateOnly(block.start_date), "dd/MM/yyyy", { locale: ptBR })}</div>
            
            <div className="text-muted-foreground">Fim:</div>
            <div>{format(parseDateOnly(block.end_date), "dd/MM/yyyy", { locale: ptBR })}</div>
          </div>

          {block.reason && (
            <div className="text-xs border-t pt-1">
              <span className="text-muted-foreground">Motivo: </span>
              {block.reason}
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

export default BlockedBlock;
