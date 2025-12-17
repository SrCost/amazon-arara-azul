import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Loader2, QrCode, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { maskCardNumber, maskExpiryDate, maskCVV, detectCardBrand } from "@/lib/cardMasks";
import { maskCPF } from "@/lib/cpfValidator";

interface PaymentStepProps {
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  cardName: string;
  setCardName: (value: string) => void;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardExpiry: string;
  setCardExpiry: (value: string) => void;
  cardCvv: string;
  setCardCvv: (value: string) => void;
  cardCpf: string;
  setCardCpf: (value: string) => void;
  installments: string;
  setInstallments: (value: string) => void;
  showPixCode: boolean;
  pixQrCode: string;
  pixQrCodeBase64: string;
  pixTicketUrl?: string;
  isGeneratingPix: boolean;
  onGeneratePixQrCode: () => void;
  paymentVerified: boolean;
  paymentStatus: string;
  isCheckingPayment: boolean;
  onCheckPayment: () => void;
  calculateTotal: () => number;
  checkIn?: Date;
  checkOut?: Date;
  pricePerNight: number;
  selectedPackage: string | null;
  packages: any[];
}

export const PaymentStep = ({
  paymentMethod,
  setPaymentMethod,
  cardName,
  setCardName,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  cardCpf,
  setCardCpf,
  installments,
  setInstallments,
  showPixCode,
  pixQrCode,
  pixQrCodeBase64,
  pixTicketUrl,
  isGeneratingPix,
  onGeneratePixQrCode,
  paymentVerified,
  paymentStatus,
  isCheckingPayment,
  onCheckPayment,
  calculateTotal,
  checkIn,
  checkOut,
  pricePerNight,
  selectedPackage,
  packages,
}: PaymentStepProps) => {
  const { t } = useTranslation();

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const paymentMethods = [
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "pix", label: "PIX" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-2 sm:mb-4">
          {t("reservation.step4")}
        </h2>
        <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
          Escolha a forma de pagamento
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.value}
            onClick={() => setPaymentMethod(method.value)}
            className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all ${
              paymentMethod === method.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm sm:text-base">{method.label}</span>
              {paymentMethod === method.value && (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Credit Card Form */}
      {paymentMethod === "credit_card" && (
        <div className="space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="cardName" className="text-sm">Nome no Cartão *</Label>
              <Input
                id="cardName"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Nome completo como no cartão"
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="cardCpf" className="text-sm">CPF do Titular *</Label>
              <Input
                id="cardCpf"
                value={cardCpf}
                onChange={(e) => setCardCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="text-sm sm:text-base"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="cardNumber" className="text-sm">Número do Cartão *</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="text-sm sm:text-base"
            />
            {cardNumber && detectCardBrand(cardNumber) !== 'unknown' && (
              <p className="text-xs text-muted-foreground mt-1">
                Bandeira: {detectCardBrand(cardNumber).toUpperCase()}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="cardExpiry" className="text-sm">Validade *</Label>
              <Input
                id="cardExpiry"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(maskExpiryDate(e.target.value))}
                placeholder="MM/AA"
                maxLength={5}
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="cardCvv" className="text-sm">CVV *</Label>
              <Input
                id="cardCvv"
                value={cardCvv}
                onChange={(e) => setCardCvv(maskCVV(e.target.value))}
                placeholder="123"
                maxLength={4}
                type="password"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="installments" className="text-sm">Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger id="installments" className="text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 10, 12].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}x {n === 1 ? "à vista" : `de R$ ${(calculateTotal() / n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* PIX Form */}
      {paymentMethod === "pix" && (
        <div className="space-y-4 border-t pt-4">
          <div className="max-w-md">
            <Label htmlFor="pixCpf">CPF para o PIX *</Label>
            <Input
              id="pixCpf"
              value={cardCpf}
              onChange={(e) => setCardCpf(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          {!showPixCode && (
            <div className="text-center py-4">
              <Button
                onClick={onGeneratePixQrCode}
                disabled={isGeneratingPix || !cardCpf}
                className="bg-gradient-forest"
              >
                {isGeneratingPix ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando QR Code...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Gerar QR Code PIX
                  </span>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Clique acima para gerar o QR Code e realizar o pagamento
              </p>
            </div>
          )}

          {showPixCode && pixQrCodeBase64 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg text-center border-2 border-green-200">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm mb-3 sm:mb-4">
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                QR Code PIX gerado!
              </div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Escaneie o QR Code para pagar via PIX</h3>
              <img 
                src={`data:image/png;base64,${pixQrCodeBase64}`} 
                alt="QR Code PIX" 
                width={256}
                height={256}
                className="w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-3 sm:mb-4 border rounded-lg"
              />
              {pixQrCode && (
                <div className="mt-3 sm:mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Ou copie o código PIX:</p>
                  <div className="bg-muted p-2 rounded font-mono text-[10px] sm:text-xs break-all max-h-16 sm:max-h-20 overflow-y-auto">
                    {pixQrCode}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(pixQrCode);
                        toast.success('Código PIX copiado!');
                      }}
                      className="text-xs sm:text-sm"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Copiar código
                    </Button>
                    {pixTicketUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-xs sm:text-sm"
                      >
                        <a href={pixTicketUrl} target="_blank" rel="noopener noreferrer">
                          <QrCode className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Abrir no app
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Payment Status Indicator */}
              <div className="mt-4 p-4 rounded-lg border">
                {paymentVerified || paymentStatus === 'approved' ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Pagamento PIX Confirmado!</span>
                  </div>
                ) : isCheckingPayment ? (
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verificando pagamento PIX...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-amber-600">
                      <RefreshCw className="h-5 w-5" />
                      <span>Aguardando pagamento PIX...</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCheckPayment}
                      disabled={isCheckingPayment}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verificar pagamento
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-green-700 mt-4 bg-green-50 p-3 rounded">
                {paymentVerified 
                  ? "✓ Pagamento PIX confirmado! Clique em \"Próximo\" para finalizar sua reserva"
                  : "✓ Após efetuar o pagamento PIX, aguarde a confirmação ou clique em \"Verificar pagamento\""
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Total Summary */}
      <div className="bg-muted p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
          <span className="font-semibold text-sm sm:text-base">{t("reservation.total")}</span>
          <span className="text-xl sm:text-2xl font-bold text-primary">
            R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        {checkIn && checkOut && !selectedPackage && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
            {nights} noites × R$ {pricePerNight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
        {selectedPackage && (
          <p className="text-[10px] sm:text-xs text-green-600 mt-1 sm:mt-2">
            ✓ Pacote com hospedagem incluída
          </p>
        )}
      </div>
    </div>
  );
};
