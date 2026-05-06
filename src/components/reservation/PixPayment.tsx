import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Copy, ExternalLink, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { validateCPF, maskCPF } from "@/lib/cpfValidator";
import { useTranslation } from "react-i18next";

interface PixPaymentProps {
  pixQrCode: string;
  pixQrCodeBase64: string;
  ticketUrl?: string;
  isGenerating: boolean;
  paymentVerified: boolean;
  paymentStatus: string;
  cpf: string;
  onCpfChange: (cpf: string) => void;
  onGeneratePix: () => void;
}

export const PixPayment = ({
  pixQrCode,
  pixQrCodeBase64,
  ticketUrl,
  isGenerating,
  paymentVerified,
  paymentStatus,
  cpf,
  onCpfChange,
  onGeneratePix,
}: PixPaymentProps) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pixQrCode || paymentVerified) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pixQrCode, paymentVerified]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = useCallback(() => {
    if (pixQrCode) {
      navigator.clipboard.writeText(pixQrCode);
      setCopied(true);
      toast.success(t("reservation.pix.copiedToast"));
      setTimeout(() => setCopied(false), 3000);
    }
  }, [pixQrCode, t]);

  const handleOpenInBank = useCallback(() => {
    if (ticketUrl) {
      window.open(ticketUrl, '_blank');
    }
  }, [ticketUrl]);

  const cpfError = cpf && !validateCPF(cpf);

  if (pixQrCode) {
    return (
      <div className="space-y-6">
        {paymentVerified && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 ml-2">
              <strong>{t("reservation.pix.confirmed")}</strong> {t("reservation.pix.confirmedDesc")}
            </AlertDescription>
          </Alert>
        )}

        {!paymentVerified && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
              <span className="text-sm">{t("reservation.pix.remaining")}</span>
            </div>

            <div className="flex justify-center">
              <Card className="p-6 bg-white inline-block shadow-lg">
                {pixQrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pixQrCodeBase64}`}
                    alt={t("reservation.pix.qrAlt")}
                    width={256}
                    height={256}
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                    <QrCode className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="lg"
                className="w-full max-w-md"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? t("reservation.pix.copied") : t("reservation.pix.copy")}
              </Button>

              {ticketUrl && (
                <Button
                  onClick={handleOpenInBank}
                  variant="secondary"
                  size="lg"
                  className="w-full max-w-md"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t("reservation.pix.openBank")}
                </Button>
              )}
            </div>

            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 text-sm">
                {t("reservation.pix.waitInfo")}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t("reservation.pix.waiting")}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t("reservation.pix.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("reservation.pix.subtitle")}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="pixCpf">{t("reservation.pix.cpf")}</Label>
            <Input
              id="pixCpf"
              value={cpf}
              onChange={(e) => onCpfChange(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className={cpfError ? "border-destructive" : ""}
            />
            {cpfError && (
              <p className="text-xs text-destructive mt-1">{t("reservation.pix.cpfInvalid")}</p>
            )}
          </div>

          <Button
            onClick={onGeneratePix}
            disabled={isGenerating || !cpf || cpfError}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("reservation.pix.generating")}
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                {t("reservation.pix.generate")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
