import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Plane, Ship, MapPin, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import rioNegroEncontro from "@/assets/rio-negro-encontro.webp";
import { usePageMeta } from "@/hooks/usePageMeta";

const HowToGetThere = () => {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Como Chegar | Pousada Arara Azul – Manacapuru, AM',
    description: 'Saiba como chegar à Pousada Arara Azul. Transfer do aeroporto de Manaus, transporte fluvial e terrestre até nossos bangalôs em Manacapuru.',
  });
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              {t("howToGetThere.title")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t("howToGetThere.subtitle")}
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-10 sm:mb-16">
            <img
              src={rioNegroEncontro}
              alt={t("howToGetThere.heroAlt")}
              width={1200}
              height={400}
              className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover rounded-lg shadow-strong"
              loading="lazy"
              decoding="async"
            />
          </div>

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
                      {t("howToGetThere.planeBoat")}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      {t("howToGetThere.planeBoatDesc")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{t("howToGetThere.duration34h")}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{t("howToGetThere.departureManaus")}</span>
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
                      {t("howToGetThere.riverCruise")}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      {t("howToGetThere.riverCruiseDesc")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{t("howToGetThere.duration12d")}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{t("howToGetThere.weeklyDepartures")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{t("howToGetThere.transferIncluded")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("howToGetThere.transferDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4 sm:mb-6 text-center">
              {t("howToGetThere.importantTips")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-foreground mb-2 sm:mb-3">{t("howToGetThere.documentation")}</h3>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li>• {t("howToGetThere.doc1")}</li>
                    <li>• {t("howToGetThere.doc2")}</li>
                    <li>• {t("howToGetThere.doc3")}</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-foreground mb-2 sm:mb-3">{t("howToGetThere.whatToBring")}</h3>
                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li>• {t("howToGetThere.bring1")}</li>
                    <li>• {t("howToGetThere.bring2")}</li>
                    <li>• {t("howToGetThere.bring3")}</li>
                    <li>• {t("howToGetThere.bring4")}</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-3xl font-display font-bold text-foreground mb-6 text-center">
              {t("howToGetThere.locationTitle")}
            </h2>
            <div className="rounded-lg overflow-hidden shadow-strong">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63773.68135042783!2d-60.548989418755264!3d-3.093691099999988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x926c63e4533d9e21%3A0xd159f0067b07177d!2sPousada%20Arara%20Azul!5e0!3m2!1spt-BR!2sbr!4v1732857788999"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: "8px" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title="Pousada Arara Azul – Google Maps"
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
                {t("howToGetThere.openInMaps")}
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
