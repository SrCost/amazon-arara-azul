import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Check, Mail, MessageCircle, Calendar, Users, Home, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePaymentRealtime } from "@/hooks/usePaymentRealtime";

const ReservationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const reservationId = searchParams.get("reservationId") || "";
  const guestName = searchParams.get("name") || searchParams.get("guestName") || "Hóspede";
  const lodgeName = searchParams.get("lodge") || searchParams.get("lodgeName") || "Bangalô";
  const packageName = searchParams.get("package");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests") || "2";
  const total = searchParams.get("total") || "0";
  const email = searchParams.get("email") || "";
  const paymentMethod = searchParams.get("paymentMethod") || "pix";
  const initialStatus = searchParams.get("status") || "pending";

  // Realtime payment status
  const { paymentStatus: realtimeStatus, isPaid } = usePaymentRealtime(reservationId || null);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  // Update status from realtime
  useEffect(() => {
    if (realtimeStatus) {
      setCurrentStatus(realtimeStatus);
    }
  }, [realtimeStatus]);

  // Format reservation number as PAA-XXXXXX
  const formatReservationNumber = (id: string): string => {
    if (!id) return 'N/A';
    // Extract only numbers from UUID and take last 6
    const numbers = id.replace(/[^0-9]/g, '');
    const suffix = numbers.slice(-6).padStart(6, '0');
    return `PAA-${suffix}`;
  };

  useEffect(() => {
    // If no params, redirect to home
    if (!checkIn || !checkOut) {
      navigate("/");
    }
  }, [checkIn, checkOut, navigate]);

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'approved':
      case 'paid':
      case 'pago':
        return <Badge className="bg-green-100 text-green-800">Pagamento Aprovado</Badge>;
      case 'pending':
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Aguardando Pagamento</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Pagamento Não Aprovado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{currentStatus}</Badge>;
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Acabei de fazer uma reserva na Pousada Arara Azul.\n\nNúmero: ${formatReservationNumber(reservationId)}\nNome: ${guestName}\nBangalô: ${lodgeName}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}`
    );
    window.open(`https://wa.me/559284829983?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Reserva Confirmada!
            </h1>
            <p className="text-muted-foreground">
              Obrigado, {guestName}! Sua reserva foi realizada com sucesso.
            </p>
          </div>

          {/* Reservation Details Card */}
          <Card className="mb-6">
            <CardContent className="p-6 space-y-6">
              {/* Status and ID */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número da Reserva</p>
                  <p className="font-mono text-lg font-semibold text-primary">
                    {formatReservationNumber(reservationId)}
                  </p>
                </div>
                {getStatusBadge()}
              </div>

              <Separator />

              {/* Reservation Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bangalô</p>
                    <p className="font-medium">{lodgeName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Período</p>
                    <p className="font-medium">
                      {checkIn && checkOut 
                        ? `${new Date(checkIn).toLocaleDateString('pt-BR')} - ${new Date(checkOut).toLocaleDateString('pt-BR')}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hóspedes</p>
                    <p className="font-medium">{guests} {parseInt(guests) === 1 ? 'pessoa' : 'pessoas'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium">
                      {paymentMethod === 'pix' ? 'PIX' : 
                       paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 
                       paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package if selected */}
              {packageName && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pacote Selecionado</p>
                    <p className="font-medium">{packageName}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Valor Total</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {parseFloat(total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-900">
              <Mail className="inline h-4 w-4 mr-2" />
              Um e-mail de confirmação será enviado para você com todos os detalhes da reserva.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full"
            >
              <a href={`mailto:${email || 'contato@arara-azul.com.br'}`}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar para meu e-mail
              </a>
            </Button>

            <Button
              size="lg"
              onClick={handleWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Conversar com a Pousada
            </Button>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a página inicial
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReservationSuccess;