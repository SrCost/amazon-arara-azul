import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Mail, MessageCircle, Calendar, Users, Home, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePaymentRealtime } from "@/hooks/usePaymentRealtime";
import { createWhatsAppLink } from "@/lib/whatsapp";

const ReservationSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // Realtime payment status - passa o status inicial da URL
  const { paymentStatus: currentStatus, isPaid } = usePaymentRealtime(
    reservationId || null,
    initialStatus
  );

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
        return <Badge className="bg-green-100 text-green-800">{t('admin.confirmed')}</Badge>;
      case 'pending':
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('admin.pending')}</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">{t('admin.cancelled')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{currentStatus}</Badge>;
    }
  };

  const handleWhatsApp = () => {
    const reservationMessage = `${t('whatsapp.reservationContact')}\n\nNúmero: ${formatReservationNumber(reservationId)}\nNome: ${guestName}\nBangalô: ${lodgeName}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}`;
    const whatsappUrl = createWhatsAppLink(reservationMessage);
    window.open(whatsappUrl, '_blank');
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
              {t('reservation.reservationSuccess')}
            </h1>
            <p className="text-muted-foreground">
              {t('common.welcome')}, {guestName}!
            </p>
          </div>

          {/* Reservation Details Card */}
          <Card className="mb-6">
            <CardContent className="p-6 space-y-6">
              {/* Status and ID */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.reservations')}</p>
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
                    <p className="text-sm text-muted-foreground">{t('nav.lodges')}</p>
                    <p className="font-medium">{lodgeName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('search.checkIn')} - {t('search.checkOut')}</p>
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
                    <p className="text-sm text-muted-foreground">{t('search.guests')}</p>
                    <p className="font-medium">{guests} {parseInt(guests) === 1 ? 'pessoa' : t('common.people')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('reservation.paymentMethod')}</p>
                    <p className="font-medium">
                      {paymentMethod === 'pix' ? 'PIX' : 
                       paymentMethod === 'credit_card' ? t('reservation.creditCard') : 
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
                    <p className="text-sm text-muted-foreground mb-1">{t('nav.packages')}</p>
                    <p className="font-medium">{packageName}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{t('reservation.total')}</p>
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
              {t('contact.success')}
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
                {t('contact.send')}
              </a>
            </Button>

            <Button
              size="lg"
              onClick={handleWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('support.talkOnWhatsApp')}
            </Button>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReservationSuccess;
