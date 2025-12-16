import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarX, Loader2 } from "lucide-react";
import { getDailyRate, formatDailyRate, calculateNights } from "@/lib/pricing";

interface DateSelectionProps {
  lodgeName: string;
  checkIn?: Date;
  checkOut?: Date;
  onCheckInChange: (date: Date | undefined) => void;
  onCheckOutChange: (date: Date | undefined) => void;
  guests: string;
  onGuestsChange: (value: string) => void;
  blockedDates: Date[];
  loadingAvailability: boolean;
  isDateAvailable: (date: Date) => boolean;
  selectedPackage: string | null;
  packages: any[];
  pricePerNight: number;
  calculateTotal: () => number;
}

export const DateSelection = ({
  lodgeName,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  guests,
  onGuestsChange,
  blockedDates,
  loadingAvailability,
  isDateAvailable,
  selectedPackage,
  packages,
  pricePerNight,
  calculateTotal,
}: DateSelectionProps) => {
  const { t } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-4">
          {t("reservation.step2")}
        </h2>
        <p className="text-muted-foreground mb-6">
          Escolha as datas da sua estadia em {lodgeName}
        </p>
      </div>

      {loadingAvailability ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando disponibilidade...</span>
        </div>
      ) : (
        <>
          {blockedDates.length > 0 && (
            <Alert>
              <CalendarX className="h-4 w-4" />
              <AlertDescription>
                Algumas datas já estão reservadas e aparecerão desabilitadas no calendário.
              </AlertDescription>
            </Alert>
          )}

          {selectedPackage && (
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Pacote selecionado:</strong> As datas serão ajustadas automaticamente conforme a duração do pacote ({packages.find(p => p.id === selectedPackage)?.duration}).
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">{t("search.checkIn")}</Label>
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={onCheckInChange}
                disabled={(date) => {
                  const dateWithoutTime = new Date(date);
                  dateWithoutTime.setHours(0, 0, 0, 0);
                  return dateWithoutTime < today || !isDateAvailable(date);
                }}
                className="rounded-md border pointer-events-auto"
              />
            </div>
            <div>
              <Label className="mb-2 block">{t("search.checkOut")}</Label>
              {selectedPackage ? (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Check-out calculado automaticamente:
                  </p>
                  <p className="text-lg font-semibold">
                    {checkOut?.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={onCheckOutChange}
                  disabled={(date) => {
                    const dateWithoutTime = new Date(date);
                    dateWithoutTime.setHours(0, 0, 0, 0);
                    if (!checkIn) return true;
                    const checkInWithoutTime = new Date(checkIn);
                    checkInWithoutTime.setHours(0, 0, 0, 0);
                    return dateWithoutTime <= checkInWithoutTime || !isDateAvailable(date);
                  }}
                  className="rounded-md border pointer-events-auto"
                />
              )}
            </div>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="guests">{t("search.guests")}</Label>
        <Select value={guests} onValueChange={onGuestsChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 pessoa</SelectItem>
            <SelectItem value="2">2 pessoas</SelectItem>
            <SelectItem value="3">3 pessoas</SelectItem>
            <SelectItem value="4">4 pessoas</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Máximo de 4 hóspedes por acomodação (pensão completa + transfer incluso)
        </p>
      </div>

      {checkIn && checkOut && (
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="font-semibold mb-2">Resumo da Reserva</p>
          
          {selectedPackage && (
            <>
              <div className="flex justify-between text-sm">
                <span>Pacote turístico (inclui hospedagem):</span>
                <span className="font-medium">
                  R$ {Number(packages.find(p => p.id === selectedPackage)?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t pt-2" />
            </>
          )}
          
          <div className="flex justify-between items-center">
            <p className="font-semibold">{t("reservation.total")}</p>
            <p className="text-2xl font-bold text-primary">
              R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          {!selectedPackage && (
            <p className="text-xs text-muted-foreground">
              {nights} noites × R$ {formatDailyRate(parseInt(guests), pricePerNight)}/noite ({guests} hóspede{parseInt(guests) > 1 ? 's' : ''})
            </p>
          )}
        </div>
      )}
    </div>
  );
};
