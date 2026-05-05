import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Leaf, Sun, Droplet, Users, Heart, Recycle, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import sustainabilityImg from "@/assets/sustainability-new.jpg";
import familiaAnfitria from "@/assets/familia-anfitria.jpg";
import { usePageMeta } from "@/hooks/usePageMeta";

const Sustainability = () => {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Sustentabilidade | Pousada Arara Azul – Manacapuru, AM',
    description: 'Turismo sustentável na Amazônia. Energia renovável, emprego local, conservação florestal e apoio às comunidades ribeirinhas em Manacapuru.',
  });

  const initiatives = [
    { icon: Sun, key: "solarEnergy" },
    { icon: Droplet, key: "waterManagement" },
    { icon: Recycle, key: "zeroWaste" },
    { icon: Users, key: "localJobs" },
    { icon: Heart, key: "communitySupport" },
    { icon: Leaf, key: "forestConservation" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              {t("sustainability.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("sustainability.subtitle")}
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-lg overflow-hidden shadow-strong mb-12 sm:mb-16">
            <img
              src={sustainabilityImg}
              alt={t("sustainability.title")}
              width={1200}
              height={400}
              className="w-full h-[250px] sm:h-[350px] md:h-[400px] object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {initiatives.map(({ icon: Icon, key }) => (
              <div key={key} className="bg-card p-5 sm:p-8 rounded-lg shadow-soft hover:shadow-medium transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-forest mb-3 sm:mb-4">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-display font-semibold mb-2 sm:mb-3 text-foreground">
                  {t(`sustainability.${key}`)}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t(`sustainability.${key}Desc`)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-forest text-white rounded-lg p-6 sm:p-8 md:p-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-8 sm:mb-12">
              {t("sustainability.impactTitle")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">{t("sustainability.stat5000")}</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">{t("sustainability.protectedHectares")}</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">{t("sustainability.stat120")}</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">{t("sustainability.supportedFamilies")}</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">{t("sustainability.stat100")}</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">{t("sustainability.renewableEnergy")}</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">{t("sustainability.stat85")}</div>
                <div className="text-sm sm:text-base md:text-lg opacity-90">{t("sustainability.localTeam")}</div>
              </div>
            </div>
          </div>

          <section className="mt-12 sm:mt-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl" />
            <div className="relative bg-card rounded-2xl shadow-strong p-6 sm:p-10 md:p-16">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-forest mb-4">
                  <Home className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">
                  {t("sustainability.familyHostTitle")}
                </h2>
                <div className="w-20 sm:w-24 h-1 bg-gradient-forest mx-auto mt-4 rounded-full" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="relative group opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                  <div className="absolute -inset-2 bg-gradient-forest rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 blur-xl" />
                  <img
                    src={familiaAnfitria}
                    alt={t("sustainability.familyHostTitle")}
                    className="relative w-full rounded-xl shadow-strong object-cover aspect-[4/5] sm:aspect-[3/4] group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="space-y-5 sm:space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {t("sustainability.familyHostText1")}
                  </p>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {t("sustainability.familyHostText2")}
                  </p>
                  <blockquote className="relative pl-5 sm:pl-6 border-l-4 border-primary bg-primary/5 py-4 pr-4 rounded-r-lg">
                    <p className="text-base sm:text-lg text-foreground italic leading-relaxed">
                      "{t("sustainability.familyHostQuote")}"
                    </p>
                  </blockquote>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4 sm:mb-6">
              {t("sustainability.missionTitle")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-3 sm:mb-4">
              {t("sustainability.missionText1")}
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {t("sustainability.missionText2")}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sustainability;
