import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReservationFlowProps {
  lodgeName: string;
  pricePerNight: number;
  roomId: string;
  onClose: () => void;
}

const ReservationFlow = ({ lodgeName, pricePerNight, roomId, onClose }: ReservationFlowProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState("2");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const steps = [
    { number: 1, title: t("reservation.step2") },
    { number: 2, title: t("reservation.step3") },
    { number: 3, title: t("reservation.step4") },
    { number: 4, title: t("reservation.step5") },
  ];

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights * pricePerNight;
  };

  const handleNext = () => {
    if (step === 1 && (!checkIn || !checkOut)) {
      toast.error("Selecione as datas de check-in e check-out");
      return;
    }
    if (step === 2 && (!guestName || !guestEmail)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (step === 3 && !paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer uma reserva");
      return;
    }

    setIsSubmitting(true);
    try {
      const totalPrice = calculateTotal();
      
      // Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          room_id: roomId,
          check_in: checkIn?.toISOString().split('T')[0],
          check_out: checkOut?.toISOString().split('T')[0],
          guests: parseInt(guests),
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          special_requests: specialRequests,
          payment_method: paymentMethod,
          total_price: totalPrice,
          status: "confirmed",
          payment_status: "pending",
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          reservation_id: reservation.id,
          amount: totalPrice,
          payment_method: paymentMethod,
          status: "pending",
        });

      if (paymentError) throw paymentError;

      toast.success(t("reservation.reservationSuccess"));
      onClose();
    } catch (error) {
      console.error("Reservation error:", error);
      toast.error("Erro ao criar reserva. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.number
                      ? "bg-gradient-forest text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.number ? <Check className="h-5 w-5" /> : s.number}
                </div>
                <span className="text-xs mt-2 text-center">{s.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 ${
                    step > s.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Dates */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold mb-4">
                  {t("reservation.step2")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  Escolha as datas da sua estadia em {lodgeName}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 block">{t("search.checkIn")}</Label>
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">{t("search.checkOut")}</Label>
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={(date) => date < new Date() || (checkIn ? date <= checkIn : false)}
                    className="rounded-md border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guests">{t("search.guests")}</Label>
                <Select value={guests} onValueChange={setGuests}>
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
              </div>

              {checkIn && checkOut && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold mb-2">{t("reservation.total")}</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {calculateTotal().toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.ceil(
                      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
                    )}{" "}
                    noites
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Guest Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold mb-4">
                  {t("reservation.step3")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  Preencha seus dados para a reserva
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("reservation.guestName")}</Label>
                  <Input
                    id="name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t("reservation.guestEmail")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t("reservation.guestPhone")}</Label>
                  <Input
                    id="phone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="requests">{t("reservation.specialRequests")}</Label>
                  <Textarea
                    id="requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Alguma solicitação especial?"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold mb-4">
                  {t("reservation.step4")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  Escolha a forma de pagamento
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { value: "credit", label: t("reservation.creditCard") },
                  { value: "pix", label: t("reservation.pix") },
                  { value: "paypal", label: t("reservation.paypal") },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      paymentMethod === method.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{method.label}</span>
                      {paymentMethod === method.value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("reservation.total")}</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-green-600" />
              </div>

              <div>
                <h2 className="text-2xl font-display font-bold mb-4">
                  Revisão da Reserva
                </h2>
                <p className="text-muted-foreground">
                  Confirme os detalhes da sua reserva
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pousada:</span>
                  <span className="font-medium">{lodgeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hóspede:</span>
                  <span className="font-medium">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in:</span>
                  <span className="font-medium">
                    {checkIn?.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out:</span>
                  <span className="font-medium">
                    {checkOut?.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    R$ {calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("common.previous")}
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button onClick={handleNext} className="bg-gradient-forest">
                {t("common.next")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirm} 
                disabled={isSubmitting}
                className="bg-gradient-forest"
              >
                {isSubmitting ? t("common.loading") : t("reservation.confirmReservation")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationFlow;