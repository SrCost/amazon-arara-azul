import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReviewStepProps {
  lodgeName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: string;
  checkIn?: Date;
  checkOut?: Date;
  paymentMethod: string;
  selectedPackage: string | null;
  packages: any[];
  calculateTotal: () => number;
}

const localeMap: Record<string, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

export const ReviewStep = ({
  lodgeName,
  guestName,
  guestEmail,
  guestPhone,
  guests,
  checkIn,
  checkOut,
  paymentMethod,
  selectedPackage,
  packages,
  calculateTotal,
}: ReviewStepProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";
  const dateLocale = localeMap[lang] || "pt-BR";

  const nights =
    checkIn && checkOut
      ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  const guestCount = parseInt(guests) || 0;

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "credit_card":
        return t("reservation.review.paymentCard");
      case "pix":
        return t("reservation.review.paymentPix");
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <Check className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-display font-bold mb-4">{t("reservation.review.title")}</h2>
        <p className="text-muted-foreground">{t("reservation.review.subtitle")}</p>
      </div>

      <div className="bg-muted p-6 rounded-lg text-left space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("reservation.review.lodge")}</span>
          <span className="font-medium">{lodgeName}</span>
        </div>

        {selectedPackage && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("reservation.review.package")}</span>
            <span className="font-medium">{packages.find((p) => p.id === selectedPackage)?.name}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("reservation.review.guest")}</span>
          <span className="font-medium">{guestName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("reservation.review.email")}</span>
          <span className="font-medium text-sm">{guestEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("reservation.review.phone")}</span>
          <span className="font-medium">{guestPhone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("reservation.review.guests")}</span>
          <span className="font-medium">{t("reservation.summary.guest", { count: guestCount })}</span>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("reservation.review.checkIn")}</span>
            <span className="font-medium">{checkIn?.toLocaleDateString(dateLocale)}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-muted-foreground">{t("reservation.review.checkOut")}</span>
            <span className="font-medium">{checkOut?.toLocaleDateString(dateLocale)}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-muted-foreground">{t("reservation.review.nights")}</span>
            <span className="font-medium">{nights}</span>
          </div>
        </div>

        {selectedPackage && (
          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="bg-green-50 p-2 rounded text-xs text-green-800">
              {t("reservation.review.stayIncluded")}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-3 border-t mt-3">
          <span className="font-semibold text-lg">{t("reservation.review.total")}</span>
          <span className="text-2xl font-bold text-primary">
            R$ {calculateTotal().toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between pt-2">
          <span className="text-muted-foreground">{t("reservation.review.paymentMethod")}</span>
          <span className="font-medium">{getPaymentMethodLabel(paymentMethod)}</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
        <p className="text-sm text-yellow-800">
          <strong>{t("reservation.review.important")}</strong> {t("reservation.review.importantText")}
        </p>
      </div>
    </div>
  );
};
