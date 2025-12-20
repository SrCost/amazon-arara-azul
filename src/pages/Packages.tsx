import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { createWhatsAppLink } from "@/lib/whatsapp";

const Packages = () => {
  usePageMeta({
    title: 'Pacotes Amazônicos | Pousada Arara Azul – Manacapuru, AM',
    description: 'Pacotes completos com hospedagem, alimentação, transporte e experiências na Amazônia. Japiim, Uirapuru e Araraúna: escolha sua aventura.',
  });

  const { t } = useTranslation();

  const packages = [
    {
      id: "japiim",
      nameKey: "packages.japiimName",
      durationKey: "packages.5days4nights",
      people: 2,
      experienceKeys: [
        "packages.exp_dolphins",
        "packages.exp_village",
        "packages.exp_jungle",
        "packages.exp_caiman",
        "packages.exp_sunrise",
        "packages.exp_sunset",
        "packages.exp_monkeys",
        "packages.exp_beach",
        "packages.exp_samauma",
      ],
      inclusionKeys: [
        "packages.inc_fullBoard",
        "packages.inc_transport",
        "packages.inc_welcome",
        "packages.inc_drink",
      ],
      pricing: {
        1: "R$ 8.732,50",
        2: "R$ 17.465,00",
        3: "R$ 23.796,00",
        4: "R$ 29.648,00",
      },
      total: "R$ 17.465,00",
      highlightKey: "packages.highlight_japiim",
    },
    {
      id: "uirapuru",
      nameKey: "packages.uirapuruName",
      durationKey: "packages.5days4nights",
      people: 2,
      experienceKeys: [
        "packages.exp_dolphins",
        "packages.exp_village",
        "packages.exp_jungle",
        "packages.exp_caiman",
        "packages.exp_piranha",
        "packages.exp_sunsetBar",
        "packages.exp_sunrise",
        "packages.exp_artisanal",
        "packages.exp_flourHouse",
      ],
      inclusionKeys: [
        "packages.inc_fullBoard",
        "packages.inc_transport",
        "packages.inc_welcome",
        "packages.inc_drink",
        "packages.inc_dinner",
      ],
      pricing: {
        2: "R$ 16.410,00",
      },
      total: "R$ 16.410,00",
      highlightKey: "packages.highlight_uirapuru",
    },
    {
      id: "ararauna",
      nameKey: "packages.araunaName",
      durationKey: "packages.7days6nights",
      people: 2,
      experienceKeys: [
        "packages.exp_dolphins",
        "packages.exp_village",
        "packages.exp_jungle",
        "packages.exp_caiman",
        "packages.exp_piranha",
        "packages.exp_sunrise",
        "packages.exp_sunsetBar",
        "packages.exp_monkeys",
        "packages.exp_artisanal",
        "packages.exp_flourHouse",
        "packages.exp_waterfall",
        "packages.exp_beach",
        "packages.exp_samauma",
      ],
      inclusionKeys: [
        "packages.inc_fullBoard",
        "packages.inc_transport",
        "packages.inc_welcome",
        "packages.inc_drink",
      ],
      pricing: {
        1: "R$ 12.667,50",
        2: "R$ 25.335,00",
        3: "R$ 34.402,00",
        4: "R$ 42.750,00",
      },
      total: "R$ 25.335,00",
      highlightKey: "packages.highlight_arauna",
    },
  ];

  const whatsappUrl = createWhatsAppLink(t('whatsapp.packageCustomInquiry'));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4">{t("packages.title")}</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">{t("packages.subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Gavião Panema - Minimalist Card */}
      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-3xl mx-auto"
          >
            <Card className="border-dashed border-2 border-amber-300 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-950/50 dark:hover:to-orange-950/50 transition-all duration-300 cursor-pointer group">
              <CardContent className="py-4 px-4 sm:py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl">✨</span>
                  <div>
                    <h3 className="font-display font-bold text-amber-800 dark:text-amber-200 text-lg sm:text-xl">
                      {t("packages.gaviaoName")}
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                      {t("packages.customPackage")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-4 py-2 rounded-full group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold text-sm sm:text-base">{t("packages.talkWithConsultant")}</span>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {packages.map((pkg) => (
              <PackageCard 
                key={pkg.id} 
                id={pkg.id}
                name={t(pkg.nameKey)}
                duration={t(pkg.durationKey)}
                people={pkg.people}
                experiences={pkg.experienceKeys.map(key => t(key))}
                inclusions={pkg.inclusionKeys.map(key => t(key))}
                total={pkg.total}
                highlight={t(pkg.highlightKey)}
              />
            ))}
          </div>


          {/* Final Section */}
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 sm:p-8 md:p-12 border border-border">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">{t("packages.qualityTitle")}</h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{t("packages.qualityDescription")}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Packages;
