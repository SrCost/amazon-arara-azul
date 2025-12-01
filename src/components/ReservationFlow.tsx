import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { validateCPF } from "@/lib/cpfValidator";
import { validateCardNumber, validateExpiryDate } from "@/lib/cardMasks";
import { useMercadoPago } from "@/hooks/useMercadoPago";

// Import step components
import { StepProgress } from "@/components/reservation/StepProgress";
import { PackageSelection } from "@/components/reservation/PackageSelection";
import { DateSelection } from "@/components/reservation/DateSelection";
import { GuestInfoForm } from "@/components/reservation/GuestInfoForm";
import { PaymentStep } from "@/components/reservation/PaymentStep";
import { ReviewStep } from "@/components/reservation/ReviewStep";

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
  
  // Step state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Package state
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  
  // Date state
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState("2");
  
  // Guest info state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
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
  
  // Payment state
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
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mercado Pago hook
  const { mercadoPago, createCardToken, getPaymentMethodFromBin } = useMercadoPago();

  const steps = [
    { number: 1, title: "Pacote" },
    { number: 2, title: "Datas" },
    { number: 3, title: "Dados" },
    { number: 4, title: "Pagamento" },
    { number: 5, title: "Confirmação" },
  ];

  // Load initial dates
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const calculateTotal = useCallback(() => {
    if (!checkIn || !checkOut) return 0;
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      if (pkg) return Number(pkg.price) || 0;
    }
    
    return nights * pricePerNight;
  }, [checkIn, checkOut, selectedPackage, packages, pricePerNight]);

  // Check payment status
  const checkPaymentStatus = useCallback(async (paymentIdToCheck: string, resId: string) => {
    try {
      setIsCheckingPayment(true);
      
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId: paymentIdToCheck, reservationId: resId }
      });

      if (error) return null;
      
      if (data?.status === 'approved') {
        setPaymentStatus('approved');
        setPaymentVerified(true);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        toast.success('✓ Pagamento confirmado!');
        return 'approved';
      } else if (data?.status === 'rejected' || data?.status === 'cancelled') {
        setPaymentStatus('failed');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        toast.error('Pagamento não aprovado');
        return 'failed';
      }
      
      return data?.status || 'pending';
    } catch (err) {
      return null;
    } finally {
      setIsCheckingPayment(false);
    }
  }, []);

  // Start polling for PIX
  const startPaymentPolling = useCallback((paymentIdToCheck: string, resId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    checkPaymentStatus(paymentIdToCheck, resId);
    
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus(paymentIdToCheck, resId);
    }, 5000);
    
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 600000);
  }, [checkPaymentStatus]);

  // Create reservation first, then process payment
  const createReservation = async (): Promise<string> => {
    if (reservationId) return reservationId;

    const totalPrice = calculateTotal();
    const reservationData = {
      room_id: roomId,
      room_name: lodgeName,
      package_id: selectedPackage || null,
      user_id: user?.id || null,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone || null,
      check_in: checkIn!.toISOString().split('T')[0],
      check_out: checkOut!.toISOString().split('T')[0],
      guests: parseInt(guests),
      total_price: totalPrice,
      special_requests: specialRequests || null,
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
      status: 'pending',
      payment_status: 'pending',
    };

    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select('id')
      .single();

    if (error) throw new Error('Erro ao criar reserva: ' + error.message);
    
    setReservationId(data.id);
    return data.id;
  };

  // Generate PIX QR Code - using mercadopago-checkout
  const handleGeneratePixQrCode = async () => {
    if (!cardCpf || !validateCPF(cardCpf)) {
      toast.error("Informe um CPF válido para gerar o PIX");
      return;
    }

    if (!checkIn || !checkOut || !guestName || !guestEmail) {
      toast.error("Dados incompletos");
      return;
    }

    setIsGeneratingPix(true);

    try {
      // Create reservation first
      const resId = await createReservation();
      const totalPrice = calculateTotal();

      // Call mercadopago-checkout with payment_method: "pix"
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'mercadopago-checkout',
        {
          body: {
            reservation_id: resId,
            amount: totalPrice,
            payer_name: guestName,
            payer_email: guestEmail,
            payer_cpf: cardCpf.replace(/\D/g, ''),
            payment_method: "pix", // Explicitly PIX
            description: `Reserva ${lodgeName} - Pousada Arara Azul`
          }
        }
      );

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error_message || "Falha ao gerar QR Code PIX");
      }

      if (paymentData.payment_id) setPaymentId(paymentData.payment_id);

      if (paymentData.pix) {
        setPixQrCode(paymentData.pix.qr_code || '');
        setPixQrCodeBase64(paymentData.pix.qr_code_base64 || '');
        setShowPixCode(true);
        setPaymentCreated(true);
        toast.success("QR Code PIX gerado com sucesso!");
        
        if (paymentData.payment_id && resId) {
          startPaymentPolling(paymentData.payment_id, resId);
        }
      } else {
        throw new Error("QR Code não retornado pela API");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar QR Code PIX");
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = () => {
    if (step === 2) {
      if (!checkIn || !checkOut) {
        toast.error("Selecione as datas de check-in e check-out");
        return;
      }
      if (!checkAvailability(checkIn, checkOut)) {
        toast.error("As datas selecionadas não estão disponíveis");
        return;
      }
    }
    
    if (step === 3) {
      if (!guestName || !guestEmail || !guestPhone) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      if (!isValidEmail(guestEmail)) {
        toast.error("Digite um e-mail válido (ex: nome@email.com)");
        return;
      }
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
      if (selectedPackage) {
        const pkg = packages.find(p => p.id === selectedPackage);
        if (pkg && parseInt(guests) > pkg.people) {
          toast.error(`Este pacote é limitado a ${pkg.people} pessoa(s)`);
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
      } else if (paymentMethod === "pix") {
        if (!cardCpf) {
          toast.error("CPF é obrigatório para PIX");
          return;
        }
        if (!showPixCode) {
          toast.error("Por favor, gere o QR Code PIX antes de continuar");
          return;
        }
      }
    }
    
    if (step < 5) setStep(step + 1);
  };

  // Confirm reservation
  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);

      if (!checkIn || !checkOut || !guestName || !guestEmail || !guestPhone || !paymentMethod) {
        toast.error("Por favor, preencha todos os dados");
        setIsSubmitting(false);
        return;
      }

      const totalPrice = calculateTotal();

      // PIX payment already created - verify and confirm
      if (paymentMethod === "pix" && reservationId && paymentCreated) {
        if (!paymentVerified && paymentStatus !== 'approved') {
          if (paymentId) {
            const finalStatus = await checkPaymentStatus(paymentId, reservationId);
            if (finalStatus !== 'approved') {
              toast.error("Aguardando confirmação do pagamento PIX");
              setIsSubmitting(false);
              return;
            }
          } else {
            toast.error("Por favor, complete o pagamento PIX");
            setIsSubmitting(false);
            return;
          }
        }
        
        await supabase
          .from("reservations")
          .update({ status: "confirmed", payment_status: "paid" })
          .eq('id', reservationId);

        toast.success("🎉 Reserva confirmada com sucesso!");
        
        const selectedPkg = packages.find(p => p.id === selectedPackage);
        const params = new URLSearchParams({
          name: guestName, lodge: lodgeName,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          guests, total: totalPrice.toString(), email: guestEmail,
          paymentMethod: "pix"
        });
        if (selectedPkg) params.append('package', selectedPkg.name);
        
        window.location.href = `/reserva-concluida?${params.toString()}`;
        return;
      }

      // Credit card payment - create reservation first, then process payment
      if (paymentMethod === "credit_card") {
        if (!checkAvailability(checkIn, checkOut)) {
          toast.error("Desculpe, as datas já foram reservadas");
          setIsSubmitting(false);
          setStep(2);
          return;
        }

        // Create reservation first
        const resId = await createReservation();

        if (!mercadoPago) {
          throw new Error('Sistema de pagamento não carregado');
        }

        // Create card token
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

        const cardToken = await createCardToken(cardData);
        if (!cardToken?.id) throw new Error('Erro ao processar dados do cartão');

        // Get payment method from card BIN
        const cardBin = cardNumber.replace(/\D/g, '').substring(0, 6);
        const paymentMethodId = await getPaymentMethodFromBin(cardBin);
        
        // Call mercadopago-checkout with payment_method: "credit_card"
        const { data: paymentResult, error: paymentError } = await supabase.functions.invoke(
          'mercadopago-checkout',
          {
            body: {
              reservation_id: resId,
              amount: totalPrice,
              payer_name: guestName,
              payer_email: guestEmail,
              payer_cpf: cardCpf.replace(/\D/g, ''),
              payment_method: "credit_card", // Explicitly credit_card
              card_token: cardToken.id,
              installments: parseInt(installments),
              payment_method_id: paymentMethodId,
              description: `Reserva ${lodgeName} - Pousada Arara Azul`
            }
          }
        );

        if (paymentError || !paymentResult?.success) {
          throw new Error(paymentResult?.error_message || "Erro ao processar pagamento");
        }

        if (paymentResult.status === 'approved') {
          toast.success("🎉 Pagamento aprovado!");
        } else {
          toast.info("Pagamento em processamento");
        }
      }

      toast.success("🎉 Reserva confirmada com sucesso!");
      
      setTimeout(() => {
        const selectedPkg = packages.find(p => p.id === selectedPackage);
        const params = new URLSearchParams({
          name: guestName, lodge: lodgeName,
          checkIn: checkIn?.toISOString().split('T')[0] || '',
          checkOut: checkOut?.toISOString().split('T')[0] || '',
          guests, total: totalPrice.toString(), email: guestEmail,
          paymentMethod: paymentMethod // Pass the actual selected payment method
        });
        if (selectedPkg) params.append('package', selectedPkg.name);
        
        window.location.href = `/reserva-concluida?${params.toString()}`;
      }, 1500);
      
    } catch (error: any) {
      toast.error(error?.message || "Erro ao completar reserva");
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Progress */}
      <StepProgress steps={steps} currentStep={step} />

      {/* Main Content - Clean Single Column */}
      <Card className="mt-6">
        <CardContent className="p-6">
          {step === 1 && (
            <PackageSelection
              packages={packages}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
            />
          )}

          {step === 2 && (
            <DateSelection
              lodgeName={lodgeName}
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={(date) => {
                setCheckIn(date);
                if (selectedPackage && date) {
                  const pkg = packages.find(p => p.id === selectedPackage);
                  if (pkg) {
                    const nights = pkg.duration.includes("4 noites") ? 4 : 6;
                    const newCheckOut = new Date(date);
                    newCheckOut.setDate(newCheckOut.getDate() + nights);
                    setCheckOut(newCheckOut);
                  }
                }
              }}
              onCheckOutChange={setCheckOut}
              guests={guests}
              onGuestsChange={setGuests}
              blockedDates={blockedDates}
              loadingAvailability={loadingAvailability}
              isDateAvailable={isDateAvailable}
              selectedPackage={selectedPackage}
              packages={packages}
              pricePerNight={pricePerNight}
              calculateTotal={calculateTotal}
            />
          )}

          {step === 3 && (
            <GuestInfoForm
              isForeign={isForeign}
              setIsForeign={setIsForeign}
              guestName={guestName}
              setGuestName={setGuestName}
              guestEmail={guestEmail}
              setGuestEmail={setGuestEmail}
              guestPhone={guestPhone}
              setGuestPhone={setGuestPhone}
              cpf={cpf}
              setCpf={setCpf}
              birthDate={birthDate}
              setBirthDate={setBirthDate}
              address={address}
              setAddress={setAddress}
              country={country}
              setCountry={setCountry}
              nationality={nationality}
              setNationality={setNationality}
              passport={passport}
              setPassport={setPassport}
              nextDestination={nextDestination}
              setNextDestination={setNextDestination}
              emergencyContact={emergencyContact}
              setEmergencyContact={setEmergencyContact}
              dietaryRestrictions={dietaryRestrictions}
              setDietaryRestrictions={setDietaryRestrictions}
              specialRequests={specialRequests}
              setSpecialRequests={setSpecialRequests}
            />
          )}

          {step === 4 && (
            <PaymentStep
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cardName={cardName}
              setCardName={setCardName}
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              cardExpiry={cardExpiry}
              setCardExpiry={setCardExpiry}
              cardCvv={cardCvv}
              setCardCvv={setCardCvv}
              cardCpf={cardCpf}
              setCardCpf={setCardCpf}
              installments={installments}
              setInstallments={setInstallments}
              showPixCode={showPixCode}
              pixQrCode={pixQrCode}
              pixQrCodeBase64={pixQrCodeBase64}
              isGeneratingPix={isGeneratingPix}
              onGeneratePixQrCode={handleGeneratePixQrCode}
              paymentVerified={paymentVerified}
              paymentStatus={paymentStatus}
              isCheckingPayment={isCheckingPayment}
              onCheckPayment={() => paymentId && reservationId && checkPaymentStatus(paymentId, reservationId)}
              calculateTotal={calculateTotal}
              checkIn={checkIn}
              checkOut={checkOut}
              pricePerNight={pricePerNight}
              selectedPackage={selectedPackage}
              packages={packages}
            />
          )}

          {step === 5 && (
            <ReviewStep
              lodgeName={lodgeName}
              guestName={guestName}
              guestEmail={guestEmail}
              guestPhone={guestPhone}
              guests={guests}
              checkIn={checkIn}
              checkOut={checkOut}
              paymentMethod={paymentMethod}
              selectedPackage={selectedPackage}
              packages={packages}
              calculateTotal={calculateTotal}
            />
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
                    <Loader2 className="h-5 w-5 animate-spin" />
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
