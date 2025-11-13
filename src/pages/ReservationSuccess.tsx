import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const ReservationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const guestName = searchParams.get("name") || "Hóspede";
  const lodgeName = searchParams.get("lodge") || "Pousada";
  const packageName = searchParams.get("package");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guests = searchParams.get("guests") || "2";
  const total = searchParams.get("total") || "0";

  useEffect(() => {
    // If no params, redirect to home
    if (!checkIn || !checkOut) {
      navigate("/");
    }
  }, [checkIn, checkOut, navigate]);

  const whatsappMessage = encodeURIComponent(
    `Olá! Acabei de fazer uma reserva em ${lodgeName} para ${checkIn} até ${checkOut}. Gostaria de mais informações.`
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-green-600" />
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Reserva Confirmada!
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                Obrigado, {guestName}! Sua reserva foi realizada com sucesso.
              </p>

              <div className="bg-muted p-6 rounded-lg mb-8 text-left">
                <h2 className="font-semibold text-lg mb-4">Detalhes da Reserva</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pousada:</span>
                    <span className="font-medium">{lodgeName}</span>
                  </div>
                  {packageName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pacote:</span>
                      <span className="font-medium">{packageName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-medium">{checkIn && new Date(checkIn).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">{checkOut && new Date(checkOut).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hóspedes:</span>
                    <span className="font-medium">{guests} {parseInt(guests) === 1 ? 'pessoa' : 'pessoas'}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="text-muted-foreground font-semibold">Valor Total:</span>
                    <span className="font-bold text-primary">R$ {parseFloat(total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-900">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Um e-mail de confirmação foi enviado para você com todos os detalhes da reserva.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Precisa de ajuda ou tem alguma dúvida?
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-forest hover:opacity-90"
                    asChild
                  >
                    <a
                      href={`https://wa.me/5511999999999?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      WhatsApp
                    </a>
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                  >
                    <a href="mailto:contato@arara-azul.com.br">
                      <Mail className="mr-2 h-5 w-5" />
                      E-mail
                    </a>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="mt-6"
                >
                  Voltar para a página inicial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReservationSuccess;