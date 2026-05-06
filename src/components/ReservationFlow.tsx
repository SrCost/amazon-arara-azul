import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { validateCPF } from "@/lib/cpfValidator";
import { validateCardNumber, validateExpiryDate } from "@/lib/cardMasks";
import { useMercadoPago } from "@/hooks/useMercadoPago";
import { getDailyRate, calculateNights } from "@/lib/pricing";
import { usePaymentRealtime } from "@/hooks/usePaymentRealtime";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const { t, i18n } = useTranslation();
  const guestLanguage = (i18n.language || 'pt').split('-')[0];
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    loading: loadingAvailability,
    blockedDates,
    isDateAvailable,
    checkAvailability,
    getNextAvailableDates,
    refreshAvailability,
  } = useRoomAvailability(roomId);
  
  // Step state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Package state
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [wantsConsultorContact, setWantsConsultorContact] = useState(false);
  
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
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
  const [pixTicketUrl, setPixTicketUrl] = useState("");
  const [showPixCode, setShowPixCode] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [localPaymentStatus, setLocalPaymentStatus] = useState<string>("pending");
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const pixTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Error handling state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState<"order" | "pix_timeout" | "card_failed" | "general">("general");
  const [canRetry, setCanRetry] = useState(false);
  const [pixExpired, setPixExpired] = useState(false);
  
  // Mercado Pago hook
  const { mercadoPago, createCardToken, getPaymentMethodFromBin } = useMercadoPago();
  
  // Realtime payment status hook
  const { 
    paymentStatus: realtimePaymentStatus, 
    isPaid, 
    isConnected: realtimeConnected,
    checkPaymentStatus: checkRealtimeStatus 
  } = usePaymentRealtime(reservationId);

  // Sync realtime status with local state
  const paymentStatus = realtimePaymentStatus || localPaymentStatus;

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pixTimeoutRef.current) {
        clearTimeout(pixTimeoutRef.current);
      }
    };
  }, []);

  // Realtime payment status update effect
  useEffect(() => {
    if (isPaid && !paymentVerified) {
      setPaymentVerified(true);
      setLocalPaymentStatus('paid');
      toast.success('✓ Pagamento confirmado via Realtime!');
      
      // Clear PIX timeout
      if (pixTimeoutRef.current) {
        clearTimeout(pixTimeoutRef.current);
        pixTimeoutRef.current = null;
      }
    }
  }, [isPaid, paymentVerified]);

  // Polling para verificar status PIX (fallback quando Realtime não funciona)
  useEffect(() => {
    if (!showPixCode || paymentVerified || paymentMethod !== 'pix' || !reservationId) {
      return;
    }

    const pollInterval = setInterval(async () => {
      console.log('=== POLLING STATUS PIX ===');
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { reservationId }
        });
        
        console.log('Poll result:', data);
        
        if (data?.status === 'approved' || data?.status === 'paid' || data?.mapped_status === 'completed') {
          setPaymentVerified(true);
          setLocalPaymentStatus('paid');
          toast.success('✓ Pagamento PIX confirmado!');
          clearInterval(pollInterval);
          
          // Clear PIX timeout
          if (pixTimeoutRef.current) {
            clearTimeout(pixTimeoutRef.current);
            pixTimeoutRef.current = null;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Polling a cada 5 segundos

    return () => clearInterval(pollInterval);
  }, [showPixCode, paymentVerified, paymentMethod, reservationId]);

  // Auto-avanço quando pagamento PIX confirmado
  useEffect(() => {
    if (step === 4 && paymentMethod === "pix" && paymentVerified && showPixCode) {
      toast.success('✓ Pagamento confirmado! Avançando para confirmação...');
      setTimeout(() => setStep(5), 1500);
    }
  }, [paymentVerified, step, paymentMethod, showPixCode]);

  const isCustomizablePackage = useCallback((pkg: any) => {
    return pkg?.price === 0 || pkg?.name?.toLowerCase().includes('gavião') || pkg?.name?.toLowerCase().includes('panema');
  }, []);

  const calculateTotal = useCallback(() => {
    if (!checkIn || !checkOut) return 0;
    const nights = calculateNights(checkIn, checkOut);
    const guestsNum = parseInt(guests) || 2;
    
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      // If customizable package (price 0), only charge for accommodation with dynamic pricing
      if (pkg && isCustomizablePackage(pkg)) {
        return getDailyRate(guestsNum, pricePerNight) * nights;
      }
      if (pkg) return Number(pkg.price) || 0;
    }
    
    // Dynamic pricing based on number of guests, using database pricePerNight
    return getDailyRate(guestsNum, pricePerNight) * nights;
  }, [checkIn, checkOut, guests, selectedPackage, packages, isCustomizablePackage, pricePerNight]);

  // Manual check payment status (fallback)
  const checkPaymentStatus = useCallback(async (paymentIdToCheck: string, resId: string) => {
    try {
      setIsCheckingPayment(true);
      
      // First try Realtime check
      const realtimeStatus = await checkRealtimeStatus();
      if (realtimeStatus === 'paid' || realtimeStatus === 'approved') {
        setLocalPaymentStatus('paid');
        setPaymentVerified(true);
        toast.success('✓ Pagamento confirmado!');
        return 'approved';
      }
      
      // Fallback to Edge Function check
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId: paymentIdToCheck, reservationId: resId }
      });

      if (error) return null;
      
      if (data?.status === 'approved' || data?.status === 'paid') {
        setLocalPaymentStatus('paid');
        setPaymentVerified(true);
        toast.success('✓ Pagamento confirmado!');
        return 'approved';
      } else if (data?.status === 'rejected' || data?.status === 'cancelled') {
        setLocalPaymentStatus('failed');
        toast.error('Pagamento não aprovado');
        return 'failed';
      }
      
      return data?.status || 'pending';
    } catch (err) {
      return null;
    } finally {
      setIsCheckingPayment(false);
    }
  }, [checkRealtimeStatus]);

  // Helper to build payload for create-order-mp
  // Generate PIX QR Code - using dedicated Edge Function
  const handleGeneratePixQrCode = async () => {
    if (!cardCpf || !validateCPF(cardCpf)) {
      toast.error("Informe um CPF válido para gerar o PIX");
      return;
    }

    if (!checkIn || !checkOut || !guestName || !guestEmail) {
      toast.error("Dados incompletos");
      return;
    }

    // Clear any previous PIX timeout
    if (pixTimeoutRef.current) {
      clearTimeout(pixTimeoutRef.current);
    }

    setIsGeneratingPix(true);
    setPixExpired(false);

    try {
      const totalPrice = calculateTotal();
      const payload = {
        bungalow_id: roomId,
        checkin: checkIn!.toISOString().split('T')[0],
        checkout: checkOut!.toISOString().split('T')[0],
        guests: parseInt(guests),
        full_name: guestName,
        email: guestEmail,
        phone: guestPhone || null,
        cpf: cardCpf.replace(/\D/g, ''),
        date_of_birth: birthDate || null,
        is_foreign: isForeign,
        foreign_passport: isForeign ? passport : null,
        foreign_nationality: isForeign ? nationality : null,
        total_amount: totalPrice,
        package_id: selectedPackage || null,
        accepted_terms: acceptedTerms,
        accepted_at: acceptedTerms ? new Date().toISOString() : null
      };

      // Call dedicated PIX Edge Function
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-pix-payment',
        { body: payload }
      );

      if (orderError || !orderData?.success) {
        // Verificar se é erro de conflito de datas (409)
        if (orderData?.error === 'dates_unavailable') {
          toast.error("❌ Datas indisponíveis! Alguém reservou antes de você. Por favor, escolha outras datas.");
          await refreshAvailability();
          setStep(2); // Voltar para seleção de datas
          setCheckIn(undefined);
          setCheckOut(undefined);
          return;
        }
        
        const errorMsg = orderData?.error || "Falha ao criar pedido PIX";
        setErrorType("order");
        setErrorMessage(errorMsg);
        setCanRetry(true);
        setErrorDialogOpen(true);
        logErrorToAudit("pix_order_error", errorMsg);
        return;
      }

      // Store reservation and payment IDs (triggers Realtime subscription)
      if (orderData.reservation_id) setReservationId(orderData.reservation_id);
      if (orderData.payment_id) setPaymentId(orderData.payment_id);

      if (orderData.pix) {
        setPixQrCode(orderData.pix.qr_code || '');
        setPixQrCodeBase64(orderData.pix.qr_code_base64 || '');
        setPixTicketUrl(orderData.pix.ticket_url || '');
        setShowPixCode(true);
        setPaymentCreated(true);
        toast.success("QR Code PIX gerado! Aguardando pagamento...");
        
        // Realtime will automatically detect payment status changes
        console.log('=== REALTIME ATIVO PARA RESERVA ===');
        console.log('Reservation ID:', orderData.reservation_id);
        console.log('Realtime Connected:', realtimeConnected);

        // Set 10-minute PIX timeout
        pixTimeoutRef.current = setTimeout(() => {
          if (!paymentVerified && paymentStatus !== 'approved' && paymentStatus !== 'paid') {
            setPixExpired(true);
            setErrorType("pix_timeout");
            setErrorMessage("O tempo para pagamento PIX expirou (10 minutos). Por favor, gere um novo QR Code para continuar.");
            setCanRetry(true);
            setErrorDialogOpen(true);
            logErrorToAudit("pix_timeout", "PIX payment expired after 10 minutes");
          }
        }, 10 * 60 * 1000); // 10 minutes

      } else {
        throw new Error("QR Code não retornado pela API");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao gerar QR Code PIX";
      toast.error(errorMsg);
      logErrorToAudit("pix_generation_error", errorMsg);
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
      
      // Validate check-in is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        toast.error("Check-in não pode ser em data passada");
        return;
      }
      
      // Validate check-out is after check-in
      if (checkOut <= checkIn) {
        toast.error("Check-out deve ser posterior ao check-in");
        return;
      }
      
      // Minimum 1 night
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      if (nights < 1) {
        toast.error("Mínimo de 1 noite para reserva");
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
      if (!acceptedTerms) {
        toast.error("Você precisa aceitar os Termos de Uso e Políticas para continuar");
        return;
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
        // Bloquear avanço até pagamento PIX confirmado
        if (!paymentVerified && paymentStatus !== 'paid' && paymentStatus !== 'approved') {
          toast.error("Aguarde a confirmação do pagamento PIX para continuar");
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
        console.log('=== CONFIRMANDO PIX ===', { reservationId, paymentCreated, paymentVerified, paymentStatus });
        
        if (!paymentVerified && paymentStatus !== 'approved' && paymentStatus !== 'paid') {
          if (paymentId) {
            const finalStatus = await checkPaymentStatus(paymentId, reservationId);
            if (finalStatus !== 'approved' && finalStatus !== 'paid') {
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
        
        const { error: updateError } = await supabase
          .from("reservations")
          .update({ status: "confirmed", payment_status: "paid" })
          .eq('id', reservationId);

        if (updateError) {
          console.error('Erro ao atualizar reserva:', updateError);
          toast.error("Erro ao confirmar reserva. Tente novamente.");
          setIsSubmitting(false);
          return;
        }

        toast.success("🎉 Reserva confirmada com sucesso!");
        
        const selectedPkg = packages.find(p => p.id === selectedPackage);
        const params = new URLSearchParams({
          reservationId: reservationId || '',
          status: 'paid',
          name: guestName, lodge: lodgeName,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          guests, total: totalPrice.toString(), email: guestEmail,
          paymentMethod: "pix"
        });
        if (selectedPkg) params.append('package', selectedPkg.name);
        
        // Fechar dialog e navegar usando React Router
        onClose();
        navigate(`/reserva-concluida?${params.toString()}`);
        return;
      }
      
      // Fallback: PIX selecionado mas dados incompletos
      if (paymentMethod === "pix" && (!reservationId || !paymentCreated)) {
        console.error('PIX incompleto:', { reservationId, paymentCreated });
        toast.error("Erro: dados de pagamento incompletos. Por favor, gere um novo QR Code.");
        setIsSubmitting(false);
        return;
      }

      // Credit card payment - using dedicated Edge Function
      if (paymentMethod === "credit_card") {
        if (!checkAvailability(checkIn, checkOut)) {
          toast.error("Desculpe, as datas já foram reservadas");
          setIsSubmitting(false);
          setStep(2);
          return;
        }

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
        const cardBrand = await getPaymentMethodFromBin(cardBin);
        
        // Build payload for dedicated card Edge Function
        const payload = {
          bungalow_id: roomId,
          checkin: checkIn!.toISOString().split('T')[0],
          checkout: checkOut!.toISOString().split('T')[0],
          guests: parseInt(guests),
          full_name: guestName,
          email: guestEmail,
          phone: guestPhone || null,
          cpf: cardCpf.replace(/\D/g, ''),
          date_of_birth: birthDate || null,
          is_foreign: isForeign,
          foreign_passport: isForeign ? passport : null,
          foreign_nationality: isForeign ? nationality : null,
          total_amount: totalPrice,
          card_token: cardToken.id,
          card_brand: cardBrand,
          installments: parseInt(installments),
          package_id: selectedPackage || null,
          accepted_terms: acceptedTerms,
          accepted_at: acceptedTerms ? new Date().toISOString() : null
        };

        const { data: orderResult, error: orderError } = await supabase.functions.invoke(
          'create-card-payment',
          { body: payload }
        );

        if (orderError || !orderResult?.success) {
          // Verificar se é erro de conflito de datas (409)
          if (orderResult?.error === 'dates_unavailable') {
            toast.error("❌ Datas indisponíveis! Alguém reservou antes de você. Por favor, escolha outras datas.");
            await refreshAvailability();
            setStep(2); // Voltar para seleção de datas
            setCheckIn(undefined);
            setCheckOut(undefined);
            setIsSubmitting(false);
            return;
          }
          
          const errorMsg = orderResult?.error_message || orderResult?.error || "Erro ao processar pagamento";
          setErrorType("card_failed");
          setErrorMessage(`Pagamento recusado: ${errorMsg}`);
          setCanRetry(true);
          setErrorDialogOpen(true);
          logErrorToAudit("card_payment_failed", errorMsg);
          setIsSubmitting(false);
          return;
        }

        // Store reservation ID (triggers Realtime subscription)
        if (orderResult.reservation_id) setReservationId(orderResult.reservation_id);

        if (orderResult.status === 'approved') {
          toast.success("🎉 Pagamento aprovado!");
        } else if (orderResult.status === 'rejected') {
          const errorMsg = orderResult.error_message || "Pagamento recusado pela operadora do cartão";
          setErrorType("card_failed");
          setErrorMessage(errorMsg);
          setCanRetry(true);
          setErrorDialogOpen(true);
          logErrorToAudit("card_rejected", errorMsg);
          setIsSubmitting(false);
          return;
        } else if (orderResult.status === 'pending' || orderResult.status === 'in_process') {
          toast.info("Pagamento em processamento. Aguarde...");
          // Realtime will handle status updates
          return;
        } else {
          toast.info("Pagamento em processamento");
        }

        // Redirect with orderResult data (credit card only)
        toast.success("🎉 Reserva confirmada com sucesso!");
        
        setTimeout(() => {
          const selectedPkg = packages.find(p => p.id === selectedPackage);
          const cardReservationId = orderResult.reservation_id || reservationId;
          const cardStatus = orderResult.status === 'approved' ? 'paid' : 'pending';
          const params = new URLSearchParams({
            reservationId: cardReservationId,
            status: cardStatus,
            name: guestName, lodge: lodgeName,
            checkIn: checkIn?.toISOString().split('T')[0] || '',
            checkOut: checkOut?.toISOString().split('T')[0] || '',
            guests, total: totalPrice.toString(), email: guestEmail,
            paymentMethod: paymentMethod
          });
          if (selectedPkg) params.append('package', selectedPkg.name);
          
          // Fechar dialog e navegar usando React Router
          onClose();
          navigate(`/reserva-concluida?${params.toString()}`);
        }, 1500);
      }
      
    } catch (error: any) {
      const errorMsg = error?.message || "Erro ao completar reserva";
      
      // Show error dialog with retry for card payments
      if (paymentMethod === "credit_card") {
        setErrorType("card_failed");
        setErrorMessage(errorMsg);
        setCanRetry(true);
        setErrorDialogOpen(true);
      } else {
        toast.error(errorMsg);
      }
      
      logErrorToAudit("payment_error", errorMsg);
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto relative">
      {/* Loading Overlay during confirmation */}
      {isSubmitting && step === 5 && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 border">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Loader2 className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Confirmando sua reserva...</h3>
              <p className="text-sm text-muted-foreground mt-1">Por favor, aguarde enquanto processamos</p>
            </div>
          </div>
        </div>
      )}

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
              wantsConsultorContact={wantsConsultorContact}
              onWantsConsultorContactChange={setWantsConsultorContact}
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
              acceptedTerms={acceptedTerms}
              setAcceptedTerms={setAcceptedTerms}
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
              pixTicketUrl={pixTicketUrl}
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
              <Button 
                onClick={handleNext} 
                className="bg-gradient-forest"
                disabled={
                  step === 4 && 
                  paymentMethod === "pix" && 
                  showPixCode && 
                  !paymentVerified && 
                  paymentStatus !== 'paid'
                }
              >
                {step === 4 && paymentMethod === "pix" && showPixCode && !paymentVerified ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguardando PIX...
                  </>
                ) : (
                  <>
                    {t("common.next")}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
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

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {errorType === "pix_timeout" ? "PIX Expirado" : 
               errorType === "card_failed" ? "Pagamento Recusado" :
               errorType === "order" ? "Erro ao Criar Pedido" : "Erro no Pagamento"}
            </DialogTitle>
            <DialogDescription className="text-left pt-2">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>
              Fechar
            </Button>
            {canRetry && (
              <Button onClick={handleRetry} className="bg-gradient-forest">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Error handling functions
  function handleRetry() {
    setErrorDialogOpen(false);
    
    if (errorType === "pix_timeout") {
      setPixQrCode("");
      setPixQrCodeBase64("");
      setPixTicketUrl("");
      setShowPixCode(false);
      setPaymentCreated(false);
      setPixExpired(false);
    } else if (errorType === "card_failed") {
      setIsSubmitting(false);
    }
  }

  function showError(type: "order" | "pix_timeout" | "card_failed" | "general", message: string, retry: boolean = false) {
    setErrorType(type);
    setErrorMessage(message);
    setCanRetry(retry);
    setErrorDialogOpen(true);
    
    // Log to audit
    logErrorToAudit(`payment_error_${type}`, message);
  }

  async function logErrorToAudit(action: string, errorMsg: string) {
    try {
      await supabase.from('activity_log').insert({
        user_email: guestEmail || 'guest',
        action: action,
        description: errorMsg,
        entity_type: 'payment_error',
        entity_id: reservationId || null,
        metadata: {
          timestamp: new Date().toISOString(),
          payment_method: paymentMethod,
          total_amount: calculateTotal()
        }
      });
    } catch (e) {
      console.error('Failed to log audit:', e);
    }
  }
};

export default ReservationFlow;
