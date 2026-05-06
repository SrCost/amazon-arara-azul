import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Package, Home, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReservationSummaryProps {
  lodgeName: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: string;
  selectedPackage?: { name: string; price: number } | null;
  totalPrice: number;
  pricePerNight: number;
}

const localeMap: Record<string, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

export const ReservationSummary = ({
  lodgeName,
  checkIn,
  checkOut,
  guests,
  selectedPackage,
  totalPrice,
  pricePerNight,
}: ReservationSummaryProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";
  const dateLocale = localeMap[lang] || "pt-BR";
  const currency = (v: number) =>
    `R$ ${v.toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const nights =
    checkIn && checkOut
      ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  const guestCount = parseInt(guests) || 0;

  return (
    <Card className="sticky top-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {t("reservation.summary.title")}
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Home className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-muted-foreground">{t("reservation.summary.lodge")}</p>
              <p className="font-medium">{lodgeName}</p>
            </div>
          </div>

          {checkIn && checkOut && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-muted-foreground">{t("reservation.summary.period")}</p>
                <p className="font-medium">
                  {checkIn.toLocaleDateString(dateLocale)} - {checkOut.toLocaleDateString(dateLocale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("reservation.summary.night", { count: nights })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Users className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-muted-foreground">{t("reservation.summary.guests")}</p>
              <p className="font-medium">{t("reservation.summary.guest", { count: guestCount })}</p>
            </div>
          </div>

          {selectedPackage && (
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-muted-foreground">{t("reservation.summary.package")}</p>
                <p className="font-medium">{selectedPackage.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-primary/20 pt-3 space-y-2">
          {selectedPackage ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("reservation.summary.packageIncludesStay")}</span>
              <span className="font-medium">{currency(selectedPackage.price)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("reservation.summary.nightlyRate", {
                  nights,
                  rate: currency(pricePerNight),
                })}
              </span>
              <span className="font-medium">{currency(nights * pricePerNight)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-primary/20">
            <span className="font-semibold text-foreground">{t("reservation.summary.total")}</span>
            <span className="text-xl font-bold text-primary">{currency(totalPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
