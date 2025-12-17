import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Plane, Ship, MapPin, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import riverAerial from "@/assets/river-aerial.jpg";

const HowToGetThere = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              Como Chegar
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              A jornada até nossos bangalôs faz parte da experiência amazônica. Oferecemos múltiplas opções de acesso a
              partir de Manaus.
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-10 sm:mb-16">
            <img
              src={riverAerial}
              alt="Vista aérea do Rio Amazonas"
              className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover rounded-lg shadow-strong"
            />
          </div>

          {/* Routes */}
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 mb-10 sm:mb-16">
            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center">
                      <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-semibold mb-2 sm:mb-3 text-foreground">
                      De Avião + Carro + Canoa
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      Voe até o Aeroporto Internacional Eduardo Gomes em Manaus (MAO). De lá, nosso serviço de transfer
                      terrestre e fluvial leva voce ate os bangalôs.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>Duração total: 3-4 horas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>Saída de Manaus</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-water flex items-center justify-center">
                      <Ship className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-semibold mb-2 sm:mb-3 text-foreground">
                      Cruzeiro
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      Para uma experiência mais imersiva, oferecemos pacotes que incluem navegação em barcos regionais,
                      permitindo apreciar a paisagem amazônica com calma e autenticidade.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>Duração: 1-2 dias</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>Saídas semanais de Manaus</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transfer Info */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Transfer Incluído</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Todos os nossos pacotes incluem transfer do aeroporto/fluvial até o bangalô e vice-versa. Nossa
                    equipe entrará em contato após a confirmação da reserva para coordenar horários e detalhes
                    logísticos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4 sm:mb-6 text-center">
              Dicas Importantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-foreground mb-2 sm:mb-3">Documentação</h3>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li>• Documento de identificação com foto</li>
                    <li>• Comprovante de vacinação (febre amarela recomendada)</li>
                    <li>• Seguro viagem (opcional, mas recomendado)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-foreground mb-2 sm:mb-3">O que Levar</h3>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li>• Roupas leves e confortáveis</li>
                    <li>• Repelente de insetos e protetor solar</li>
                    <li>• Calçados para trilhas e chinelos</li>
                    <li>• Binóculos para observação de fauna</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Google Maps Location */}
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-3xl font-display font-bold text-foreground mb-6 text-center">Nossa Localização</h2>
            <div className="rounded-lg overflow-hidden shadow-strong">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63773.68135042783!2d-60.548989418755264!3d-3.093691099999988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x926c63e4533d9e21%3A0xd159f0067b07177d!2sPousada%20Arara%20Azul!5e0!3m2!1spt-BR!2sbr!4v1732857788999"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: "8px" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da Pousada Arara Azul no Google Maps"
              />
            </div>
            <div className="text-center mt-4">
              <a
                href="https://www.google.com/maps/place/Pousada+Arara+Azul/@-3.0936911,-60.4913731,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium"
              >
                <MapPin className="h-4 w-4" />
                Abrir no Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowToGetThere;
