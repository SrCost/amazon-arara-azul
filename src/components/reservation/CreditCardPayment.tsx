import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Lock } from "lucide-react";
import { validateCPF, maskCPF } from "@/lib/cpfValidator";
import { maskCardNumber, maskExpiryDate, maskCVV, detectCardBrand, validateCardNumber, validateExpiryDate } from "@/lib/cardMasks";
import { useTranslation } from "react-i18next";

interface CreditCardPaymentProps {
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardCpf: string;
  installments: string;
  totalAmount: number;
  onCardNameChange: (value: string) => void;
  onCardNumberChange: (value: string) => void;
  onCardExpiryChange: (value: string) => void;
  onCardCvvChange: (value: string) => void;
  onCardCpfChange: (value: string) => void;
  onInstallmentsChange: (value: string) => void;
}

export const CreditCardPayment = ({
  cardName,
  cardNumber,
  cardExpiry,
  cardCvv,
  cardCpf,
  installments,
  totalAmount,
  onCardNameChange,
  onCardNumberChange,
  onCardExpiryChange,
  onCardCvvChange,
  onCardCpfChange,
  onInstallmentsChange,
}: CreditCardPaymentProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";
  const dateLocale = lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : "de-DE";
  const cardBrand = detectCardBrand(cardNumber);
  const cpfError = cardCpf && !validateCPF(cardCpf);
  const cardNumberError = cardNumber && cardNumber.replace(/\s/g, '').length >= 15 && !validateCardNumber(cardNumber);
  const expiryError = cardExpiry && cardExpiry.length === 5 && !validateExpiryDate(cardExpiry);

  // Card brand icons/colors
  const getBrandStyle = () => {
    switch (cardBrand) {
      case 'visa':
        return { color: 'text-blue-600', label: 'Visa' };
      case 'mastercard':
        return { color: 'text-red-600', label: 'Mastercard' };
      case 'amex':
        return { color: 'text-blue-800', label: 'American Express' };
      case 'elo':
        return { color: 'text-yellow-600', label: 'Elo' };
      case 'hipercard':
        return { color: 'text-red-700', label: 'Hipercard' };
      default:
        return { color: 'text-muted-foreground', label: '' };
    }
  };

  const brandStyle = getBrandStyle();

  // Calculate installment values
  const getInstallmentOptions = () => {
    const options = [];
    const fmt = (v: number) =>
      `R$ ${v.toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    for (let i = 1; i <= 12; i++) {
      const value = totalAmount / i;
      const label = i === 1
        ? t("reservation.card.cash", { amount: fmt(totalAmount) })
        : t("reservation.card.installmentOption", { n: i, amount: fmt(value) });
      options.push({ value: i.toString(), label });
    }
    return options;
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{t("reservation.card.title")}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> {t("reservation.card.secure")}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="cardName">{t("reservation.card.name")}</Label>
          <Input
            id="cardName"
            value={cardName}
            onChange={(e) => onCardNameChange(e.target.value.toUpperCase())}
            placeholder={t("reservation.card.namePlaceholder")}
            className="uppercase"
          />
        </div>

        <div>
          <Label htmlFor="cardNumber">{t("reservation.card.number")}</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => onCardNumberChange(maskCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className={cardNumberError ? "border-destructive pr-24" : "pr-24"}
            />
            {cardBrand !== 'unknown' && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${brandStyle.color}`}>
                {brandStyle.label}
              </span>
            )}
          </div>
          {cardNumberError && (
            <p className="text-xs text-destructive mt-1">{t("reservation.card.numberInvalid")}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cardExpiry">{t("reservation.card.expiry")}</Label>
            <Input
              id="cardExpiry"
              value={cardExpiry}
              onChange={(e) => onCardExpiryChange(maskExpiryDate(e.target.value))}
              placeholder={t("reservation.card.expiryPlaceholder")}
              maxLength={5}
              className={expiryError ? "border-destructive" : ""}
            />
            {expiryError && (
              <p className="text-xs text-destructive mt-1">{t("reservation.card.expiryInvalid")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cardCvv">{t("reservation.card.cvv")}</Label>
            <Input
              id="cardCvv"
              value={cardCvv}
              onChange={(e) => onCardCvvChange(maskCVV(e.target.value))}
              placeholder="000"
              maxLength={4}
              type="password"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cardCpf">{t("reservation.card.cpf")}</Label>
          <Input
            id="cardCpf"
            value={cardCpf}
            onChange={(e) => onCardCpfChange(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            className={cpfError ? "border-destructive" : ""}
          />
          {cpfError && (
            <p className="text-xs text-destructive mt-1">{t("reservation.card.cpfInvalid")}</p>
          )}
        </div>

        <div>
          <Label htmlFor="installments">{t("reservation.card.installments")}</Label>
          <Select value={installments} onValueChange={onInstallmentsChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("reservation.card.selectInstallments")} />
            </SelectTrigger>
            <SelectContent>
              {getInstallmentOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
