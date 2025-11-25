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
import { Checkbox } from "@/components/ui/checkbox";
import { validateCPF, maskCPF } from "@/lib/cpfValidator";
import { maskCardNumber, maskExpiryDate, maskCVV, detectCardBrand, validateCardNumber, validateExpiryDate } from "@/lib/cardMasks";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

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
  const [installments, setInstallments] = useState("1");
  const [pixQrCode, setPixQrCode] = useState("");
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState("");
  const [showPixCode, setShowPixCode] = useState(false);
  const [mercadoPago, setMercadoPago] = useState<any>(null);
  
  // New fields for guest information
  const [isForeign, setIsForeign] = useState(false);
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [country, setCountry] = useState("");
  const [nationality, setNationality] = useState("");
  const [passport, setPassport] = useState("");
  const [address, setAddress] = useState("");
  const [nextDestination, setNextDestination] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Initialize Mercado Pago SDK
  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
    if (publicKey && !mercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        const mp = new window.MercadoPago(publicKey);
        setMercadoPago(mp);
        console.log('✅ Mercado Pago SDK carregado');
      };
      script.onerror = () => {
        console.error('❌ Erro ao carregar SDK do Mercado Pago');
        toast.error('Erro ao carregar sistema de pagamento');
      };
      document.body.appendChild(script);
    }
  }, [mercadoPago]);

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

  // Auto-fill dates when package is selected
  useEffect(() => {
    if (selectedPackage && packages.length > 0) {
      const pkg = packages.find(p => p.id === selectedPackage);
      if (pkg && checkIn) {
        const nights = pkg.duration.includes("4 noites") ? 4 : 6;
        const newCheckOut = new Date(checkIn);
        newCheckOut.setDate(newCheckOut.getDate() + nights);
        setCheckOut(newCheckOut);
      }
    }
  }, [selectedPackage, checkIn, packages]);

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
    
    // If package is selected, return ONLY package price (accommodation is included)
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      if (pkg) {
        return Number(pkg.price) || 0;
      }
    }
    
    // Otherwise, calculate room nights only
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
    if (step === 3) {
      if (!guestName || !guestEmail || !guestPhone) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      // Validate Brazilian or Foreign required fields
      if (isForeign) {
        if (!country || !nationality || !passport || !birthDate) {
          toast.error("Preencha todos os campos obrigatórios para hóspedes estrangeiros");
          return;
        }
      } else {
        if (!cpf || !birthDate) {
          toast.error("Preencha CPF e Data de Nascimento");
          return;
        }
      }
      
      // Validate max guests for package
      if (selectedPackage) {
        const pkg = packages.find(p => p.id === selectedPackage);
        if (pkg && parseInt(guests) > pkg.people) {
          toast.error(`Este pacote é limitado a ${pkg.people} ${pkg.people === 1 ? 'pessoa' : 'pessoas'}`);
          return;
        }
      }
    }
    if (step === 4) {
      if (!paymentMethod) {
        toast.error("Selecione um método de pagamento");
        return;
      }
      if (paymentMethod === "credit_card") {
        if (!cardName || !cardNumber || !cardExpiry || !cardCvv || !cardCpf) {
          toast.error("Preencha todos os dados do cartão");
          return;
        }
        if (!validateCPF(cardCpf)) {
          toast.error("CPF inválido");
          return;
        }
        if (!validateCardNumber(cardNumber)) {
          toast.error("Número do cartão inválido");
          return;
        }
        if (!validateExpiryDate(cardExpiry)) {
          toast.error("Data de validade inválida");
          return;
        }
      } else if (paymentMethod === "pix" && !cardCpf) {
        toast.error("CPF é obrigatório para pagamento via PIX");
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
        // New guest information fields
        is_foreign: isForeign,
        cpf: !isForeign ? cpf : null,
        birth_date: birthDate || null,
        country: isForeign ? country : null,
        nationality: isForeign ? nationality : null,
        passport: isForeign ? passport : null,
        address: address || null,
        next_destination: nextDestination || null,
        dietary_restrictions: dietaryRestrictions || null,
        emergency_contact: emergencyContact || null,
      };

      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .insert(reservationData)
        .select()
        .single();

      if (reservationError) {
        console.error("Erro ao criar reserva:", reservationError);
        
        // Provide user-friendly error messages
        let errorMsg = "Não foi possível registrar a reserva. ";
        
        if (reservationError.message?.includes("violates row-level security")) {
          errorMsg += "Por favor, tente novamente ou entre em contato via WhatsApp.";
        } else if (reservationError.message?.includes("duplicate")) {
          errorMsg += "Esta reserva já existe. Verifique suas reservas anteriores.";
        } else if (reservationError.message?.includes("foreign key")) {
          errorMsg += "Dados inválidos. Por favor, verifique as informações e tente novamente.";
        } else {
          errorMsg += "Por favor, tente novamente ou entre em contato conosco via WhatsApp.";
        }
        
        toast.error(errorMsg, {
          duration: 5000,
          description: "Precisa de ajuda? Clique no botão do WhatsApp no canto da tela."
        });
        
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

      // ====== MERCADO PAGO PAYMENT INTEGRATION ======
      if (paymentMethod === "pix" || paymentMethod === "credit_card") {
        console.log(`Processando pagamento via ${paymentMethod.toUpperCase()}...`);
        
        try {
          let paymentIntentData: any = {
            reservationId: reservation.id,
            paymentMethod: paymentMethod,
            amount: totalPrice,
            payerName: guestName,
            payerEmail: guestEmail,
            payerCpf: cardCpf,
            description: `Reserva ${lodgeName} - Pousada Arara Azul`
          };

          // For credit card, create token first
          if (paymentMethod === "credit_card") {
            if (!mercadoPago) {
              throw new Error('Sistema de pagamento não carregado');
            }

            const [month, year] = cardExpiry.split('/');
            const cardData = {
              cardNumber: cardNumber.replace(/\s/g, ''),
              cardholderName: cardName,
              cardExpirationMonth: month,
              cardExpirationYear: `20${year}`,
              securityCode: cardCvv,
              identificationType: 'CPF',
              identificationNumber: cardCpf.replace(/\D/g, '')
            };

            console.log('Criando token do cartão...');
            const cardToken = await mercadoPago.createCardToken(cardData);
            
            if (!cardToken || !cardToken.id) {
              throw new Error('Erro ao processar dados do cartão');
            }

            const cardBrand = detectCardBrand(cardNumber);
            paymentIntentData = {
              ...paymentIntentData,
              cardToken: cardToken.id,
              installments: parseInt(installments),
              paymentMethodId: cardBrand
            };
          }

          // Call payment intent edge function
          console.log('Criando intenção de pagamento...');
          const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
            'create-payment-intent',
            { body: paymentIntentData }
          );

          if (paymentError) {
            console.error("Erro ao criar pagamento:", paymentError);
            throw new Error(paymentError.message || "Erro ao processar pagamento");
          }

          if (!paymentData || !paymentData.success) {
            throw new Error(paymentData?.error_message || "Falha ao processar pagamento");
          }

          // Update reservation with payment details
          await supabase
            .from("reservations")
            .update({
              payment_intent_id: paymentData.payment_id,
              payment_status: paymentData.status === 'approved' ? 'paid' : 'processing',
              payer_name: guestName,
              payer_email: guestEmail,
              payer_cpf: cardCpf,
              payment_qr_code: paymentData.pix?.qr_code,
              payment_qr_code_base64: paymentData.pix?.qr_code_base64,
              payment_ticket_url: paymentData.pix?.ticket_url,
            })
            .eq('id', reservation.id);

          // Update payment record
          await supabase
            .from("payments")
            .update({
              mercado_pago_payment_id: paymentData.payment_id,
              status: paymentData.status === 'approved' ? 'completed' : 'pending',
              payer_name: guestName,
              payer_email: guestEmail,
              payer_cpf: cardCpf,
              installments: paymentMethod === 'credit_card' ? parseInt(installments) : 1
            })
            .eq('reservation_id', reservation.id);

          if (paymentMethod === "pix") {
            setPixQrCode(paymentData.pix?.qr_code || '');
            setPixQrCodeBase64(paymentData.pix?.qr_code_base64 || '');
            setShowPixCode(true);
            toast.success("QR Code PIX gerado com sucesso!", {
              duration: 3000,
              description: "Escaneie o código para efetuar o pagamento"
            });
          } else if (paymentData.status === 'approved') {
            toast.success("🎉 Pagamento aprovado com sucesso!", {
              duration: 3000,
            });
          } else {
            toast.info("Pagamento em processamento", {
              duration: 3000,
              description: "Você receberá uma confirmação em breve"
            });
          }

        } catch (mpError: any) {
          console.error("Erro ao processar Mercado Pago:", mpError);
          toast.error(mpError.message || "Erro ao processar pagamento", {
            duration: 5000,
            description: "Por favor, tente novamente ou entre em contato via WhatsApp"
          });
          setIsSubmitting(false);
          return;
        }
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

      toast.success("🎉 Reserva confirmada com sucesso!", {
        duration: 2500,
        description: "Você receberá um email de confirmação em breve."
      });
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        const selectedPkg = packages.find(p => p.id === selectedPackage);
        const successUrl = `/reserva-concluida?name=${encodeURIComponent(guestName)}&lodge=${encodeURIComponent(lodgeName)}&checkIn=${checkIn?.toISOString().split('T')[0]}&checkOut=${checkOut?.toISOString().split('T')[0]}&guests=${guests}&total=${totalPrice}&email=${encodeURIComponent(guestEmail)}${selectedPkg ? `&package=${encodeURIComponent(selectedPkg.name)}` : ''}`;
        window.location.href = successUrl;
      }, 1500);
      
    } catch (error: any) {
      console.error("❌ Erro ao criar reserva:", error);
      
      // Only show additional toast if error wasn't already handled above
      if (!error?.message?.includes("Não foi possível registrar a reserva")) {
        const errorMessage = error?.message || "Não foi possível completar a reserva. Verifique sua conexão e tente novamente.";
        
        toast.error(errorMessage, {
          duration: 5000,
          description: "Por favor, tente novamente ou entre em contato conosco via WhatsApp."
        });
      }
      
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
                  Selecione um de nossos pacotes exclusivos ou prossiga sem pacote
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

                {packages.map((pkg: any) => {
                  const isUirapuru = pkg.name?.toLowerCase().includes('uirapuru');
                  const shortDescription = isUirapuru 
                    ? '💑 Exclusivo para casais. Jantar romântico + vivências amazônicas.' 
                    : pkg.name?.toLowerCase().includes('japiim')
                    ? '🦜 Experiência completa de 5 dias com passeios e vivências.'
                    : pkg.name?.toLowerCase().includes('araraúna')
                    ? '🦜 Pacote mais completo: 7 dias de imersão total na Amazônia.'
                    : pkg.description;
                  
                  return (
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
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{pkg.name}</h3>
                          {isUirapuru && (
                            <span className="text-xs bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-semibold">
                              Casal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {pkg.duration} • {pkg.people} {pkg.people === 1 ? 'pessoa' : 'pessoas'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {shortDescription}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          R$ {Number(pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          ✓ Estadia já inclusa no valor
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
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
                        onSelect={(date) => {
                          setCheckIn(date);
                          // Auto-adjust checkout based on package if selected
                          if (selectedPackage && date) {
                            const pkg = packages.find(p => p.id === selectedPackage);
                            if (pkg) {
                              const nights = pkg.duration.includes("4 noites") ? 4 : 6;
                              const newCheckOut = new Date(date);
                              newCheckOut.setDate(newCheckOut.getDate() + nights);
                              setCheckOut(newCheckOut);
                            }
                          } else if (checkOut && date && date >= checkOut) {
                            // Reset checkout if it conflicts
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
                      {selectedPackage ? (
                        <div className="flex items-center justify-center h-full bg-muted rounded-md border p-4">
                          <p className="text-sm text-center text-muted-foreground">
                            Data de check-out definida automaticamente pelo pacote
                          </p>
                        </div>
                      ) : (
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
                      )}
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
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold mb-2">Resumo da Reserva</p>
                  
                  {selectedPackage && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Pacote turístico:</span>
                        <span className="font-medium">
                          R$ {Number(packages.find(p => p.id === selectedPackage)?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Hospedagem ({Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} noites):</span>
                        <span className="font-medium">
                          R$ {(Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) * pricePerNight).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="border-t pt-2" />
                    </>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{t("reservation.total")}</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  {!selectedPackage && (
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} noites × R$ {pricePerNight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Guest Info */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold mb-4">
                  {t("reservation.step3")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  Preencha seus dados para a reserva
                </p>
              </div>

              {/* Foreign Guest Checkbox */}
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="isForeign"
                  checked={isForeign}
                  onCheckedChange={(checked) => setIsForeign(checked as boolean)}
                />
                <Label
                  htmlFor="isForeign"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Sou estrangeiro
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nome Completo <span className="text-destructive">*</span>
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
                      E-mail <span className="text-destructive">*</span>
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

                {/* Conditional Fields - Brazilian Guest */}
                {!isForeign && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cpf" className="text-sm font-medium">
                          CPF <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="cpf"
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="birthDate" className="text-sm font-medium">
                          Data de Nascimento <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Telefone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+55 (92) 99999-9999"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-sm font-medium">
                        Endereço
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Rua, número, bairro, cidade, estado"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {/* Conditional Fields - Foreign Guest */}
                {isForeign && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country" className="text-sm font-medium">
                          País de Origem <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Brazil, United States, etc."
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="nationality" className="text-sm font-medium">
                          Nacionalidade <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          placeholder="Brazilian, American, etc."
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="passport" className="text-sm font-medium">
                          Passaporte <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="passport"
                          value={passport}
                          onChange={(e) => setPassport(e.target.value)}
                          placeholder="Número do passaporte"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="birthDate" className="text-sm font-medium">
                          Data de Nascimento <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Telefone Internacional <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Incluir código do país
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-sm font-medium">
                        Endereço no País de Origem
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, City, State, Country"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nextDestination" className="text-sm font-medium">
                        Próximo Destino Após Hospedagem
                      </Label>
                      <Input
                        id="nextDestination"
                        value={nextDestination}
                        onChange={(e) => setNextDestination(e.target.value)}
                        placeholder="Cidade/País"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyContact" className="text-sm font-medium">
                        Contato de Emergência Internacional
                      </Label>
                      <Input
                        id="emergencyContact"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Nome e telefone"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {/* Common Fields */}
                <div>
                  <Label htmlFor="dietaryRestrictions" className="text-sm font-medium">
                    Alergias ou Restrições Alimentares
                  </Label>
                  <Textarea
                    id="dietaryRestrictions"
                    value={dietaryRestrictions}
                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                    placeholder="Descreva qualquer alergia ou restrição alimentar"
                    rows={3}
                    className="mt-1"
                  />
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
                  { value: "credit_card", label: "Cartão de Crédito" },
                  { value: "pix", label: "PIX" },
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
              {paymentMethod === "credit_card" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="cardName">Nome no Cartão *</Label>
                    <Input
                      id="cardName"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Nome completo como no cartão"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão *</Label>
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                    {cardNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {detectCardBrand(cardNumber) !== 'unknown' ? `Bandeira: ${detectCardBrand(cardNumber).toUpperCase()}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry">Validade *</Label>
                      <Input
                        id="cardExpiry"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(maskExpiryDate(e.target.value))}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCvv">CVV *</Label>
                      <Input
                        id="cardCvv"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(maskCVV(e.target.value))}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardCpf">CPF do Titular *</Label>
                      <Input
                        id="cardCpf"
                        value={cardCpf}
                        onChange={(e) => setCardCpf(maskCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                    <div>
                      <Label htmlFor="installments">Parcelas *</Label>
                      <Select value={installments} onValueChange={setInstallments}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                            const installmentValue = calculateTotal() / num;
                            return (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    🔒 Seus dados estão protegidos com criptografia de ponta a ponta
                  </p>
                  {!mercadoPago && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">Carregando sistema de pagamento seguro...</p>
                    </div>
                  )}
                </div>
              )}

              {/* PIX Form */}
              {paymentMethod === "pix" && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label htmlFor="pixCpf">CPF para PIX *</Label>
                    <Input
                      id="pixCpf"
                      value={cardCpf}
                      onChange={(e) => setCardCpf(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O CPF será utilizado para identificar o pagamento
                    </p>
                  </div>
                  {!showPixCode && (
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
                  )}
                  {showPixCode && pixQrCodeBase64 && (
                    <div className="bg-white p-6 rounded-lg text-center border-2">
                      <h3 className="font-semibold mb-4">Escaneie o QR Code para pagar</h3>
                      <img 
                        src={`data:image/png;base64,${pixQrCodeBase64}`} 
                        alt="QR Code PIX" 
                        className="w-64 h-64 mx-auto mb-4"
                      />
                      {pixQrCode && (
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Ou copie o código PIX:</p>
                          <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                            {pixQrCode}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => {
                              navigator.clipboard.writeText(pixQrCode);
                              toast.success('Código PIX copiado!');
                            }}
                          >
                            Copiar código PIX
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Remove Mercado Pago Display */}

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("reservation.total")}</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {checkIn && checkOut && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} noites × R$ {pricePerNight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {selectedPackage && ` + Pacote R$ ${Number(packages.find(p => p.id === selectedPackage)?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </p>
                )}
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
                  <span className="text-muted-foreground">Bangalô:</span>
                  <span className="font-medium">{lodgeName}</span>
                </div>
                
                {selectedPackage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pacote:</span>
                    <span className="font-medium">
                      {packages.find(p => p.id === selectedPackage)?.name}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hóspede:</span>
                  <span className="font-medium">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-mail:</span>
                  <span className="font-medium text-sm">{guestEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{guestPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hóspedes:</span>
                  <span className="font-medium">{guests} {parseInt(guests) === 1 ? 'pessoa' : 'pessoas'}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-medium">
                      {checkIn?.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">
                      {checkOut?.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Noites:</span>
                    <span className="font-medium">
                      {Math.ceil((checkOut!.getTime() - checkIn!.getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                </div>
                
                {selectedPackage && (
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pacote Selecionado:</span>
                      <span className="font-medium">
                        {packages.find(p => p.id === selectedPackage)?.name}
                      </span>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-xs text-green-800 mt-2">
                      ✓ Estadia já incluída no valor do pacote
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-3 border-t mt-3">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Método de pagamento:</span>
                  <span className="font-medium capitalize">
                    {paymentMethod === 'credit' ? 'Cartão de Crédito' : 
                     paymentMethod === 'pix' ? 'PIX' : 
                     paymentMethod === 'mercado_pago' ? 'Mercado Pago' : paymentMethod}
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Após confirmar, você receberá um e-mail com os detalhes da reserva. 
                  O pagamento será processado e você receberá a confirmação final em breve.
                </p>
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

            {step < 5 ? (
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