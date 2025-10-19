import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Plane, Ship, MapPin, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import riverAerial from "@/assets/river-aerial.jpg";

const HowToGetThere = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              Como Chegar
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A jornada até nossas pousadas faz parte da experiência amazônica. Oferecemos
              múltiplas opções de acesso a partir de Manaus e Belém.
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-16">
            <img
              src={riverAerial}
              alt="Vista aérea do rio Amazonas"
              className="w-full h-[400px] object-cover rounded-lg shadow-strong"
            />
          </div>

          {/* Routes */}
          <div className="max-w-4xl mx-auto space-y-8 mb-16">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-forest flex items-center justify-center">
                      <Plane className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold mb-3 text-foreground">
                      De Avião + Barco
                    </h2>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Voe até o Aeroporto Internacional Eduardo Gomes em Manaus (MAO). De lá,
                      nosso serviço de transfer fluvial exclusivo leva você até a pousada em
                      confortáveis lanchas rápidas.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <span>Duração total: 3-4 horas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span>Saída do Porto de Manaus</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-water flex items-center justify-center">
                      <Ship className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-display font-semibold mb-3 text-foreground">
                      Cruzeiro Fluvial
                    </h2>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Para uma experiência mais imersiva, oferecemos pacotes que incluem
                      navegação em barcos regionais, permitindo apreciar a paisagem amazônica com
                      calma e autenticidade.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <span>Duração: 1-2 dias</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-accent" />
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
                    Todos os nossos pacotes incluem transfer do aeroporto/porto até a pousada e
                    vice-versa. Nossa equipe entrará em contato após a confirmação da reserva
                    para coordenar horários e detalhes logísticos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-foreground mb-6 text-center">
              Dicas Importantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">Documentação</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Documento de identificação com foto</li>
                    <li>• Comprovante de vacinação (febre amarela recomendada)</li>
                    <li>• Seguro viagem (opcional, mas recomendado)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">O que Levar</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Roupas leves e confortáveis</li>
                    <li>• Repelente de insetos e protetor solar</li>
                    <li>• Calçados para trilhas e chinelos</li>
                    <li>• Binóculos para observação de fauna</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowToGetThere;
