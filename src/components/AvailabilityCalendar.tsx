import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

interface AvailabilityCalendarProps {
  roomId: string;
}

export const AvailabilityCalendar = ({ roomId }: AvailabilityCalendarProps) => {
  const { loading, blockedDates, isDateAvailable, reservations } = useRoomAvailability(roomId);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidade</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando disponibilidade...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilidade em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Disponível</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <XCircle className="h-3 w-3 text-red-600" />
            <span>Reservado</span>
          </Badge>
          <Badge variant="outline" className="bg-accent">
            <span>Hoje</span>
          </Badge>
        </div>

        <Calendar
          mode="single"
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Don't disable past dates for display, just show them
            return false;
          }}
          modifiers={{
            booked: blockedDates,
            available: (date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date >= today && isDateAvailable(date);
            }
          }}
          modifiersClassNames={{
            booked: "bg-red-100 text-red-900 line-through cursor-not-allowed dark:bg-red-900 dark:text-red-100",
            available: "bg-green-50 hover:bg-green-100 dark:bg-green-900/20"
          }}
          onDayMouseEnter={setHoveredDate}
          onDayMouseLeave={() => setHoveredDate(null)}
          className="rounded-md border pointer-events-auto"
        />

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Estatísticas:</p>
          <ul className="space-y-1">
            <li>• Total de reservas ativas: {reservations.length}</li>
            <li>• Datas bloqueadas: {blockedDates.length}</li>
          </ul>
        </div>

        {hoveredDate && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">
              {hoveredDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className={`mt-1 ${isDateAvailable(hoveredDate) ? 'text-green-600' : 'text-red-600'}`}>
              {isDateAvailable(hoveredDate) ? '✓ Disponível para reserva' : '✗ Data já reservada'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
