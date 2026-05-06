import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
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
import { useCalendarLocale } from "@/hooks/useCalendarLocale";

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

const localeMap: Record<string, string> = {
  pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
};

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
  const calLocale = useCalendarLocale();
  const lang = i18n.language?.split("-")[0] || "pt";
  const dateLocale = localeMap[lang] || "pt-BR";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nights = checkIn && checkOut
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const guestsNum = parseInt(guests) || 1;
  const fmt = (v: number) =>
    v.toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-4">
          {t("reservation.step2")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("dateSel.chooseDates", { lodge: lodgeName })}
        </p>
      </div>

      {loadingAvailability ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">{t("dateSel.loading")}</span>
        </div>
      ) : (
        <>
          {blockedDates.length > 0 && (
            <Alert>
              <CalendarX className="h-4 w-4" />
              <AlertDescription>{t("dateSel.blockedAlert")}</AlertDescription>
            </Alert>
          )}

          {selectedPackage && (
            <Alert className="mb-4">
              <AlertDescription>
                <strong>{t("dateSel.packageAlertPrefix")}</strong>{" "}
                {t("dateSel.packageAlertText", {
                  duration: packages.find((p) => p.id === selectedPackage)?.duration ?? "",
                })}
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
                locale={calLocale}
                disabled={(date) => {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  return d < today || !isDateAvailable(date);
                }}
                className="rounded-md border pointer-events-auto"
              />
            </div>
            <div>
              <Label className="mb-2 block">{t("search.checkOut")}</Label>
              {selectedPackage ? (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("dateSel.autoCheckout")}
                  </p>
                  <p className="text-lg font-semibold">
                    {checkOut?.toLocaleDateString(dateLocale)}
                  </p>
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={onCheckOutChange}
                  locale={calLocale}
                  disabled={(date) => {
                    const d = new Date(date);
                    d.setHours(0, 0, 0, 0);
                    if (!checkIn) return true;
                    const ci = new Date(checkIn);
                    ci.setHours(0, 0, 0, 0);
                    return d <= ci || !isDateAvailable(date);
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
            {[1, 2, 3, 4].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {t("dateSel.person", { count: n, defaultValue: `${n}` })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">{t("dateSel.maxNote")}</p>
      </div>

      {checkIn && checkOut && (
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="font-semibold mb-2">{t("dateSel.summary")}</p>

          {selectedPackage && (
            <>
              <div className="flex justify-between text-sm">
                <span>{t("dateSel.packageRow")}</span>
                <span className="font-medium">
                  R$ {fmt(Number(packages.find((p) => p.id === selectedPackage)?.price || 0))}
                </span>
              </div>
              <div className="border-t pt-2" />
            </>
          )}

          <div className="flex justify-between items-center">
            <p className="font-semibold">{t("reservation.total")}</p>
            <p className="text-2xl font-bold text-primary">R$ {fmt(calculateTotal())}</p>
          </div>

          {!selectedPackage && (
            <p className="text-xs text-muted-foreground">
              {t("dateSel.nightsLine", {
                count: guestsNum,
                nights,
                rate: formatDailyRate(guestsNum, pricePerNight),
                guests: guestsNum,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
