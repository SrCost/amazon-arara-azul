import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Package, Home, CreditCard } from "lucide-react";

interface ReservationSummaryProps {
  lodgeName: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: string;
  selectedPackage?: { name: string; price: number } | null;
  totalPrice: number;
  pricePerNight: number;
}

export const ReservationSummary = ({
  lodgeName,
  checkIn,
  checkOut,
  guests,
  selectedPackage,
  totalPrice,
  pricePerNight,
}: ReservationSummaryProps) => {
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card className="sticky top-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Resumo da Reserva
        </h3>

        <div className="space-y-3 text-sm">
          {/* Bangalô */}
          <div className="flex items-start gap-3">
            <Home className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-muted-foreground">Bangalô</p>
              <p className="font-medium">{lodgeName}</p>
            </div>
          </div>

          {/* Datas */}
          {checkIn && checkOut && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-muted-foreground">Período</p>
                <p className="font-medium">
                  {checkIn.toLocaleDateString('pt-BR')} - {checkOut.toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nights} {nights === 1 ? 'noite' : 'noites'}
                </p>
              </div>
            </div>
          )}

          {/* Hóspedes */}
          <div className="flex items-start gap-3">
            <Users className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-muted-foreground">Hóspedes</p>
              <p className="font-medium">{guests} {parseInt(guests) === 1 ? 'pessoa' : 'pessoas'}</p>
            </div>
          </div>

          {/* Pacote */}
          {selectedPackage && (
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-muted-foreground">Pacote</p>
                <p className="font-medium">{selectedPackage.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Valores */}
        <div className="border-t border-primary/20 pt-3 space-y-2">
          {selectedPackage ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pacote (inclui hospedagem)</span>
              <span className="font-medium">
                R$ {selectedPackage.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Diárias ({nights} × R$ {pricePerNight.toLocaleString('pt-BR')})
              </span>
              <span className="font-medium">
                R$ {(nights * pricePerNight).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-primary/20">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">
              R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
