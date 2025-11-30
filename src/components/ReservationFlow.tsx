import { useState, useEffect, useCallback, useRef } from "react";
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
import { Check, ChevronLeft, ChevronRight, CalendarX, Loader2, Copy, QrCode, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { validateCPF, maskCPF } from "@/lib/cpfValidator";
import { maskCardNumber, maskExpiryDate, maskCVV, detectCardBrand, validateCardNumber, validateExpiryDate } from "@/lib/cardMasks";
import { useMercadoPago } from "@/hooks/useMercadoPago";

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
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mercado Pago hook
  const { mercadoPago, isLoading: mpLoading, isConfigured: mpConfigured, error: mpError, createCardToken, getPaymentMethodFromBin } = useMercadoPago();
  
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

  // Function to check payment status
  const checkPaymentStatus = useCallback(async (paymentIdToCheck: string, resId: string) => {
    try {
      setIsCheckingPayment(true);
      console.log('Checking payment status:', paymentIdToCheck);
      
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: {
          paymentId: paymentIdToCheck,
          reservationId: resId
        }
      });

      if (error) {
        console.error('Error checking payment:', error);
        return null;
      }

      console.log('Payment status response:', data);
      
      if (data?.status === 'approved') {
        setPaymentStatus('approved');
        setPaymentVerified(true);
        
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast.success('✓ Pagamento confirmado!', {
          description: 'Seu pagamento foi aprovado com sucesso.'
        });
        
        return 'approved';
      } else if (data?.status === 'rejected' || data?.status === 'cancelled') {
        setPaymentStatus('failed');
        
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast.error('Pagamento não aprovado', {
          description: data?.status_detail || 'Tente novamente ou use outro método.'
        });
        
        return 'failed';
      }
      
      return data?.status || 'pending';
    } catch (err) {
      console.error('Error checking payment:', err);
      return null;
    } finally {
      setIsCheckingPayment(false);
    }
  }, []);

  // Start polling for PIX payment status
  const startPaymentPolling = useCallback((paymentIdToCheck: string, resId: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Initial check
    checkPaymentStatus(paymentIdToCheck, resId);
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus(paymentIdToCheck, resId);
    }, 5000);
    
    // Stop polling after 10 minutes
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 600000);
  }, [checkPaymentStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
      // For PIX, require QR code generation before proceeding
      if (paymentMethod === "pix" && !showPixCode) {
        toast.error("Por favor, gere o QR Code PIX antes de continuar");
        return;
      }
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  // Generate PIX QR Code in Step 4
  const handleGeneratePixQrCode = async () => {
    if (!cardCpf || !validateCPF(cardCpf)) {
      toast.error("Informe um CPF válido para gerar o PIX");
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error("Datas de check-in e check-out são obrigatórias");
      return;
    }

    if (!guestName || !guestEmail) {
      toast.error("Dados do hóspede são obrigatórios");
      return;
    }

    setIsGeneratingPix(true);

    try {
      const totalPrice = calculateTotal();

      // Prepare reservation data for the edge function
      const reservationData = {
        room_id: roomId,
        room_name: lodgeName,
        package_id: selectedPackage || null,
        user_id: user?.id || null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
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
      };

      console.log('Gerando PIX via Edge Function...');
      
      // Call edge function to create reservation AND generate PIX
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            reservationData: reservationId ? undefined : reservationData,
            reservationId: reservationId || undefined,
            paymentMethod: "pix",
            amount: totalPrice,
            payerName: guestName,
            payerEmail: guestEmail,
            payerCpf: cardCpf,
            description: `Reserva ${lodgeName} - Pousada Arara Azul`
          }
        }
      );

      console.log('Edge function response:', paymentData);

      if (paymentError) {
        console.error("Erro ao gerar PIX:", paymentError);
        throw new Error(paymentError.message || "Erro ao gerar QR Code PIX");
      }

      if (!paymentData?.success) {
        throw new Error(paymentData?.error_message || "Falha ao gerar QR Code PIX");
      }

      // Save reservation ID from the response
      if (paymentData.reservation_id) {
        setReservationId(paymentData.reservation_id);
      }

      // Save payment ID for status checking
      if (paymentData.payment_id) {
        setPaymentId(paymentData.payment_id);
      }

      // Set PIX data
      if (paymentData.pix) {
        setPixQrCode(paymentData.pix.qr_code || '');
        setPixQrCodeBase64(paymentData.pix.qr_code_base64 || '');
        setShowPixCode(true);
        setPaymentCreated(true);
        toast.success("QR Code PIX gerado com sucesso!", {
          description: "Escaneie o código para efetuar o pagamento"
        });
        
        // Start polling for payment status
        if (paymentData.payment_id && paymentData.reservation_id) {
          startPaymentPolling(paymentData.payment_id, paymentData.reservation_id);
        }
      } else {
        throw new Error("QR Code não retornado pela API");
      }

    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar QR Code PIX");
    } finally {
      setIsGeneratingPix(false);
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

      const totalPrice = calculateTotal();
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      // ====== PIX PAYMENT ALREADY CREATED ======
      // If PIX was generated in Step 4, verify payment before confirming
      if (paymentMethod === "pix" && reservationId && paymentCreated) {
        // Check if payment is verified
        if (!paymentVerified && paymentStatus !== 'approved') {
          // Do a final check
          if (paymentId) {
            const finalStatus = await checkPaymentStatus(paymentId, reservationId);
            if (finalStatus !== 'approved') {
              toast.error("Aguardando confirmação do pagamento", {
                description: "Por favor, complete o pagamento PIX antes de confirmar a reserva."
              });
              setIsSubmitting(false);
              return;
            }
          } else {
            toast.error("Pagamento não verificado", {
              description: "Por favor, complete o pagamento PIX antes de confirmar a reserva."
            });
            setIsSubmitting(false);
            return;
          }
        }
        
        // Payment is verified, update reservation status
        await supabase
          .from("reservations")
          .update({
            status: "confirmed",
            payment_status: "paid",
          })
          .eq('id', reservationId);

        // Log activity
        try {
          await supabase.from("activity_log").insert([{
            action: "confirm",
            entity_type: "reservation",
            entity_id: reservationId,
            description: `Reserva confirmada para ${lodgeName} via PIX - Pagamento aprovado`,
            user_id: user?.id || null,
            user_email: guestEmail,
            metadata: {
              lodge_name: lodgeName,
              guest_name: guestName,
              payment_method: "pix",
              payment_verified: true,
            }
          }]);
        } catch (logError) {
          console.warn("Falha ao registrar log:", logError);
        }

        toast.success("🎉 Reserva confirmada com sucesso!", {
          duration: 3000,
          description: "Pagamento aprovado. Você receberá um email de confirmação."
        });

        // Redirect to success page
        const params = new URLSearchParams({
          guestName,
          lodgeName,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          guests,
          total: totalPrice.toString()
        });
        
        window.location.href = `/reserva-sucesso?${params.toString()}`;
        return;
      }

      // ====== CREATE NEW RESERVATION (Credit Card) ======
      // Final availability check before creating reservation
      if (!checkAvailability(checkIn, checkOut)) {
        toast.error("Desculpe, as datas selecionadas foram reservadas. Por favor, escolha outras datas.");
        setIsSubmitting(false);
        setStep(2);
        return;
      }

      // Prepare reservation data for the edge function
      const reservationData = {
        room_id: roomId,
        room_name: lodgeName,
        package_id: selectedPackage || null,
        user_id: user?.id || null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
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
      };

      // ====== CREDIT CARD PAYMENT ======
      if (paymentMethod === "credit_card") {
        console.log('Processando pagamento via cartão...');
        
        if (!mercadoPago) {
          throw new Error('Sistema de pagamento não carregado. Aguarde ou recarregue a página.');
        }

        try {
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
          const cardToken = await createCardToken(cardData);
          
          if (!cardToken || !cardToken.id) {
            throw new Error('Erro ao processar dados do cartão');
          }

          // Get payment method ID from card BIN (first 6 digits)
          const cardBin = cardNumber.replace(/\D/g, '').substring(0, 6);
          const paymentMethodId = await getPaymentMethodFromBin(cardBin);
          console.log('Payment method identified:', paymentMethodId);
          
          // Call edge function to create reservation AND process payment
          const { data: paymentResult, error: paymentError } = await supabase.functions.invoke(
            'create-payment-intent',
            {
              body: {
                reservationData,
                paymentMethod: "credit_card",
                amount: totalPrice,
                payerName: guestName,
                payerEmail: guestEmail,
                payerCpf: cardCpf,
                cardToken: cardToken.id,
                installments: parseInt(installments),
                paymentMethodId: paymentMethodId,
                description: `Reserva ${lodgeName} - Pousada Arara Azul`
              }
            }
          );

          if (paymentError || !paymentResult?.success) {
            throw new Error(paymentResult?.error_message || paymentError?.message || "Erro ao processar pagamento");
          }

          // Save reservation ID from the response
          if (paymentResult.reservation_id) {
            setReservationId(paymentResult.reservation_id);
          }

          if (paymentResult.status === 'approved') {
            toast.success("🎉 Pagamento aprovado!", { duration: 3000 });
          } else {
            toast.info("Pagamento em processamento", {
              duration: 3000,
              description: "Você receberá uma confirmação em breve"
            });
          }

          // Log activity
          try {
            await supabase.from("activity_log").insert([{
              action: "create",
              entity_type: "reservation",
              entity_id: paymentResult.reservation_id,
              description: `Nova reserva criada para ${lodgeName} via cartão`,
              user_id: user?.id || null,
              user_email: guestEmail,
              metadata: {
                lodge_name: lodgeName,
                guest_name: guestName,
                payment_method: paymentMethod,
              }
            }]);
          } catch (logError) {
            console.warn("Falha ao registrar log:", logError);
          }

        } catch (cardError: any) {
          console.error("Erro ao processar cartão:", cardError);
          toast.error(cardError.message || "Erro ao processar pagamento", {
            duration: 5000,
            description: "Verifique os dados do cartão ou tente outro método"
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

      // Success - redirect to confirmation
      const currentResId = reservationId || 'new';
      console.log("✅ Reserva confirmada:", {
        reservationId: currentResId,
        guestName,
        lodgeName,
        paymentMethod,
      });

      toast.success("🎉 Reserva confirmada com sucesso!", {
        duration: 2500,
        description: "Você receberá um email de confirmação em breve."
      });
      
      // Redirect to success page
      setTimeout(() => {
        const selectedPkg = packages.find(p => p.id === selectedPackage);
        const params = new URLSearchParams({
          name: guestName,
          lodge: lodgeName,
          checkIn: checkIn?.toISOString().split('T')[0] || '',
          checkOut: checkOut?.toISOString().split('T')[0] || '',
          guests,
          total: totalPrice.toString(),
          email: guestEmail,
        });
        if (selectedPkg) params.append('package', selectedPkg.name);
        
        window.location.href = `/reserva-concluida?${params.toString()}`;
      }, 1500);
      
    } catch (error: any) {
      console.error("❌ Erro na reserva:", error);
      
      if (!error?.message?.includes("Não foi possível")) {
        toast.error(error?.message || "Erro ao completar reserva", {
          duration: 5000,
          description: "Tente novamente ou entre em contato via WhatsApp."
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
                      disabled={showPixCode}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O CPF será utilizado para identificar o pagamento
                    </p>
                  </div>

                  {!showPixCode && (
                    <div className="bg-muted p-6 rounded-lg text-center space-y-4">
                      <div className="w-48 h-48 bg-white mx-auto flex items-center justify-center border-2 border-dashed rounded-lg">
                        <div className="text-center">
                          <QrCode className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground px-4">
                            QR Code PIX
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleGeneratePixQrCode}
                        disabled={isGeneratingPix || !cardCpf}
                        className="w-full bg-gradient-forest"
                        size="lg"
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
                      
                      <p className="text-xs text-muted-foreground">
                        Clique acima para gerar o QR Code e realizar o pagamento
                      </p>
                    </div>
                  )}

                  {showPixCode && pixQrCodeBase64 && (
                    <div className="bg-white p-6 rounded-lg text-center border-2 border-green-200">
                      <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mb-4">
                        <Check className="h-4 w-4" />
                        QR Code gerado com sucesso!
                      </div>
                      <h3 className="font-semibold mb-4">Escaneie o QR Code para pagar</h3>
                      <img 
                        src={`data:image/png;base64,${pixQrCodeBase64}`} 
                        alt="QR Code PIX" 
                        className="w-64 h-64 mx-auto mb-4 border rounded-lg"
                      />
                      {pixQrCode && (
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Ou copie o código PIX:</p>
                          <div className="bg-muted p-2 rounded font-mono text-xs break-all max-h-20 overflow-y-auto">
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
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar código PIX
                          </Button>
                        </div>
                      )}
                      
                      {/* Payment Status Indicator */}
                      <div className="mt-4 p-4 rounded-lg border">
                        {paymentVerified || paymentStatus === 'approved' ? (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Pagamento Confirmado!</span>
                          </div>
                        ) : isCheckingPayment ? (
                          <div className="flex items-center justify-center gap-2 text-amber-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Verificando pagamento...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-amber-600">
                              <RefreshCw className="h-5 w-5" />
                              <span>Aguardando pagamento...</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => paymentId && reservationId && checkPaymentStatus(paymentId, reservationId)}
                              disabled={!paymentId || isCheckingPayment}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Verificar pagamento
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-green-700 mt-4 bg-green-50 p-3 rounded">
                        {paymentVerified 
                          ? "✓ Pagamento confirmado! Clique em \"Próximo\" para finalizar sua reserva"
                          : "✓ Após efetuar o pagamento, aguarde a confirmação ou clique em \"Verificar pagamento\""
                        }
                      </p>
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