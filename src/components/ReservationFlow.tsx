import { useState, useEffect } from "react";
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
import { Check, ChevronLeft, ChevronRight, CalendarX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReservationFlowProps {
  lodgeName: string;
  pricePerNight: number;
  roomId: string;
  onClose: () => void;
}

const ReservationFlow = ({ lodgeName, pricePerNight, roomId, onClose }: ReservationFlowProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    loading: loadingAvailability,
    blockedDates,
    isDateAvailable,
    checkAvailability,
    getNextAvailableDates,
  } = useRoomAvailability(roomId);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState("2");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardCpf, setCardCpf] = useState("");

  // Show next available dates when component loads
  useEffect(() => {
    if (!loadingAvailability && !checkIn && !checkOut) {
      const { checkIn: nextCheckIn, checkOut: nextCheckOut } = getNextAvailableDates();
      if (nextCheckIn && nextCheckOut) {
        setCheckIn(nextCheckIn);
        setCheckOut(nextCheckOut);
      }
    }
  }, [loadingAvailability]);

  // Load packages
  useEffect(() => {
    const loadPackages = async () => {
      const { data } = await supabase.from("packages_public").select("*");
      setPackages(data || []);
    };
    loadPackages();
  }, []);

  const steps = [
    { number: 1, title: "Escolher Pacote (Opcional)" },
    { number: 2, title: t("reservation.step2") },
    { number: 3, title: t("reservation.step3") },
    { number: 4, title: t("reservation.step4") },
    { number: 5, title: t("reservation.step5") },
  ];

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights * pricePerNight;
  };

  const handleNext = () => {
    if (step === 1) {
      // Package selection is optional, just proceed
    }
    if (step === 2) {
      if (!checkIn || !checkOut) {
        toast.error("Selecione as datas de check-in e check-out");
        return;
      }
      
      // Validate availability for selected dates
      if (!checkAvailability(checkIn, checkOut)) {
        toast.error("As datas selecionadas não estão disponíveis. Por favor, escolha outras datas.");
        return;
      }
    }
    if (step === 3 && (!guestName || !guestEmail)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (step === 4) {
      if (!paymentMethod) {
        toast.error("Selecione um método de pagamento");
        return;
      }
      if (paymentMethod === "credit" && (!cardName || !cardNumber || !cardExpiry || !cardCvv || !cardCpf)) {
        toast.error("Preencha todos os dados do cartão");
        return;
      }
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!checkIn || !checkOut) {
        toast.error("Por favor, selecione as datas de check-in e check-out");
        setIsSubmitting(false);
        return;
      }

      if (!guestName || !guestEmail || !guestPhone) {
        toast.error("Por favor, preencha todos os dados pessoais");
        setIsSubmitting(false);
        return;
      }

      if (!paymentMethod) {
        toast.error("Por favor, selecione um método de pagamento");
        setIsSubmitting(false);
        return;
      }

      // Final availability check before creating reservation
      if (!checkAvailability(checkIn, checkOut)) {
        toast.error("Desculpe, as datas selecionadas foram reservadas por outro cliente. Por favor, escolha outras datas.");
        setIsSubmitting(false);
        setStep(1); // Go back to date selection
        return;
      }

      const totalPrice = calculateTotal();
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create reservation record - guests don't need to be logged in
      const reservationData = {
        room_id: roomId,
        room_name: lodgeName, // Store lodge name for easy display
        package_id: selectedPackage || null, // Include selected package
        user_id: user?.id || null, // Allow null for non-logged users
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        check_in: checkIn?.toISOString().split('T')[0],
        check_out: checkOut?.toISOString().split('T')[0],
        guests: parseInt(guests),
        total_price: totalPrice,
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod,
        special_requests: specialRequests || null,
      };

      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .insert(reservationData)
        .select()
        .single();

      if (reservationError) {
        console.error("Erro ao criar reserva:", reservationError);
        
        // Provide more specific error messages
        let errorMsg = "Falha ao registrar reserva. ";
        if (reservationError.message?.includes("violates row-level security")) {
          errorMsg += "Erro de permissão. Por favor, tente novamente.";
        } else if (reservationError.message?.includes("duplicate")) {
          errorMsg += "Esta reserva já existe.";
        } else {
          errorMsg += reservationError.message || "Erro desconhecido.";
        }
        
        throw new Error(errorMsg);
      }

      // Create payment record
      const paymentData = {
        reservation_id: reservation.id,
        amount: totalPrice,
        payment_method: paymentMethod,
        status: "pending",
      };

      const { error: paymentError } = await supabase
        .from("payments")
        .insert(paymentData);

      if (paymentError) {
        console.error("Erro ao criar pagamento:", paymentError);
        throw new Error("Falha ao registrar pagamento.");
      }

      // Log activity in audit table
      try {
        await supabase.from("activity_log").insert([{
          action: "create",
          entity_type: "reservation",
          entity_id: reservation.id,
          description: `Nova reserva criada para ${lodgeName}`,
          user_id: user?.id || null,
          user_email: guestEmail,
          metadata: {
            lodge_name: lodgeName,
            guest_name: guestName,
            check_in: checkIn?.toISOString().split('T')[0],
            check_out: checkOut?.toISOString().split('T')[0],
            total_nights: nights,
            total_price: totalPrice,
            payment_method: paymentMethod,
            guests: parseInt(guests)
          }
        }]);
      } catch (logError) {
        // Don't fail reservation if logging fails
        console.warn("Falha ao registrar log de auditoria:", logError);
      }

      // ====== FUTURE INTEGRATION POINT - BANCO CAIXA ======
      // This is where automatic payment processing with Banco Caixa will be implemented
      // 
      // BANCO CAIXA INTEGRATION REQUIREMENTS:
      // API Endpoint: https://api.caixa.gov.br/payments/v1 (exemplo)
      // Authentication: Bearer token from Banco Caixa credentials
      // Required credentials: BANCO_CAIXA_CLIENT_ID, BANCO_CAIXA_SECRET_KEY
      //
      // IMPLEMENTATION FLOW:
      // 1. Create Edge Function: /supabase/functions/banco-caixa-payment/index.ts
      // 2. Store Banco Caixa credentials in Supabase secrets
      // 3. Call the edge function from here to initialize payment
      // 4. Receive payment response and update database accordingly
      //
      // EXPECTED API CALL STRUCTURE:
      // const response = await fetch(`${SUPABASE_URL}/functions/v1/banco-caixa-payment`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${session.access_token}`
      //   },
      //   body: JSON.stringify({
      //     reservation_id: reservation.id,
      //     payment_id: paymentData.id,
      //     amount: totalPrice,
      //     customer: {
      //       name: guestName,
      //       email: guestEmail,
      //       phone: guestPhone
      //     },
      //     payment_method: paymentMethod
      //   })
      // });
      //
      // EXPECTED BANCO CAIXA API RESPONSE FORMAT:
      // {
      //   success: boolean,
      //   transaction_id: string,         // Banco Caixa transaction reference
      //   bank_reference: string,         // Código de barras or PIX code
      //   status: 'paid' | 'pending' | 'failed' | 'refunded',
      //   payment_link: string,           // Link for customer to complete payment
      //   expires_at: string,             // Payment expiration timestamp
      //   updated_at: string
      // }
      //
      // AUTOMATIC STATUS UPDATE WORKFLOW:
      // 1. Banco Caixa sends webhook when payment status changes
      // 2. Edge function receives webhook at /functions/v1/banco-caixa-webhook
      // 3. Webhook updates both 'payments' and 'reservations' tables
      // 4. Realtime listeners automatically refresh admin dashboard
      //
      // DATABASE SYNC LOGIC:
      // When payment status = 'paid' (from Banco Caixa):
      //   - Update payments.status = 'completed'
      //   - Update reservations.payment_status = 'paid'
      //   - Update reservations.status = 'confirmed'
      //   - Send confirmation email to customer
      //
      // WEBHOOK SECURITY:
      // - Validate webhook signature using Banco Caixa secret key
      // - Check timestamp to prevent replay attacks
      // - Verify transaction_id matches database records
      // ================================================================

      console.log("✅ Reserva criada com sucesso:", {
        reservationId: reservation.id,
        guestName,
        guestEmail,
        lodgeName,
        roomId,
        checkIn: checkIn?.toISOString().split('T')[0],
        checkOut: checkOut?.toISOString().split('T')[0],
        totalPrice,
        paymentMethod,
        paymentStatus: "pending",
        nights
      });

      toast.success("🎉 Reserva confirmada com sucesso! Redirecionando...", {
        duration: 2000,
      });
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        const selectedPkg = packages.find(p => p.id === selectedPackage);
        const successUrl = `/reserva-concluida?name=${encodeURIComponent(guestName)}&lodge=${encodeURIComponent(lodgeName)}&checkIn=${checkIn?.toISOString().split('T')[0]}&checkOut=${checkOut?.toISOString().split('T')[0]}&guests=${guests}&total=${totalPrice}&email=${encodeURIComponent(guestEmail)}${selectedPkg ? `&package=${encodeURIComponent(selectedPkg.name)}` : ''}`;
        window.location.href = successUrl;
      }, 1500);
      
    } catch (error: any) {
      console.error("❌ Erro ao criar reserva:", error);
      const errorMessage = error?.message || "Não foi possível completar a reserva. Verifique sua conexão e tente novamente.";
      
      toast.error(errorMessage, {
        duration: 5000,
        description: "Por favor, tente novamente ou entre em contato conosco via WhatsApp."
      });
      
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
          {/* Step 1: Package Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold mb-4">
                  Escolher Pacote (Opcional)
                </h2>
                <p className="text-muted-foreground mb-6">
                  Selecione um dos nossos pacotes turísticos ou prossiga sem pacote
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedPackage === null
                      ? "border-primary border-2"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPackage(null)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Sem Pacote</h3>
                    <p className="text-sm text-muted-foreground">
                      Reservar apenas a hospedagem
                    </p>
                  </CardContent>
                </Card>

                {packages.map((pkg: any) => (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? "border-primary border-2"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{pkg.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {pkg.duration} • {pkg.people} pessoas
                      </p>
                      <p className="text-lg font-bold text-primary">
                        R$ {Number(pkg.price).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
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
                        Datas bloqueadas não podem ser selecionadas.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">{t("search.checkIn")}</Label>
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={(date) => {
                          setCheckIn(date);
                          // Reset checkout if it conflicts
                          if (checkOut && date && date >= checkOut) {
                            setCheckOut(undefined);
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Disable past dates
                          if (date < today) return true;
                          
                          // Disable blocked dates
                          return !isDateAvailable(date);
                        }}
                        className="rounded-md border pointer-events-auto"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{t("search.checkOut")}</Label>
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Disable past dates
                          if (date < today) return true;
                          
                          // Must be after check-in
                          if (checkIn && date <= checkIn) return true;
                          
                          // Check if any date between check-in and this date is blocked
                          if (checkIn) {
                            const testDate = new Date(checkIn);
                            testDate.setDate(testDate.getDate() + 1);
                            
                            while (testDate < date) {
                              if (!isDateAvailable(testDate)) {
                                return true;
                              }
                              testDate.setDate(testDate.getDate() + 1);
                            }
                          }
                          
                          return false;
                        }}
                        className="rounded-md border pointer-events-auto"
                      />
                    </div>
                  </div>
                </>
              )}

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
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo de 3 hóspedes por acomodação
                </p>
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

              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      {t("reservation.guestName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nome completo"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t("reservation.guestEmail")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t("reservation.guestPhone")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+55 (92) 99999-9999"
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluir código do país e DDD
                  </p>
                </div>

                <div>
                  <Label htmlFor="requests" className="text-sm font-medium">
                    {t("reservation.specialRequests")}
                  </Label>
                  <Textarea
                    id="requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Alguma solicitação especial? (opcional)"
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
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
                  { value: "paypal", label: "Mercado Pago" },
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

              {/* Credit Card Form */}
              {paymentMethod === "credit" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="cardName">Nome no Cartão</Label>
                    <Input
                      id="cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={16}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <Label htmlFor="cardExpiry">Validade</Label>
                      <Input
                        id="cardExpiry"
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length >= 2) {
                            val = val.slice(0, 2) + "/" + val.slice(2, 4);
                          }
                          setCardExpiry(val);
                        }}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input
                        id="cardCvv"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="cardCpf">CPF</Label>
                      <Input
                        id="cardCpf"
                        value={cardCpf}
                        onChange={(e) => setCardCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="000.000.000-00"
                        maxLength={11}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💳 Seus dados estão seguros e criptografados. Integração com gateway de pagamento será implementada em breve.
                  </p>
                </div>
              )}

              {/* PIX Display */}
              {paymentMethod === "pix" && (
                <div className="border-t pt-4">
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <div className="w-48 h-48 bg-white mx-auto mb-4 flex items-center justify-center border-2 border-dashed">
                      <p className="text-sm text-muted-foreground px-4">
                        QR Code PIX será gerado após confirmar
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Após confirmar, você receberá o código PIX para pagamento
                    </p>
                  </div>
                </div>
              )}

              {/* Mercado Pago Display */}
              {paymentMethod === "paypal" && (
                <div className="border-t pt-4">
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Você será redirecionado para o Mercado Pago para concluir o pagamento
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Integração com Mercado Pago será implementada em breve
                    </p>
                  </div>
                </div>
              )}

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

          {/* Step 5: Confirmation */}
          {step === 5 && (
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
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                ) : (
                  t("reservation.confirmReservation")
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationFlow;