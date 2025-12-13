import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Sparkles } from "lucide-react";
import { SOCIAL_LINKS } from "@/config/socialLinks";

const Packages = () => {
  const { t } = useTranslation();

  const packages = [
    {
      id: "japiim",
      name: "Pacote Japiim",
      duration: "5 dias e 4 noites",
      people: 2,
      experiences: [
        "Interação com botos",
        "Visita à aldeia local",
        "Caminhada na selva",
        "Focagem noturna de jacarés",
        "Nascer do sol",
        "Pôr do sol",
        "Macacos do Ariaú",
        "Passeio na praia de água doce",
        "Samaúma gigante",
      ],
      inclusions: [
        "Alimentação: pensão completa",
        "Transporte terrestre e fluvial (ida e volta)",
        "Recepção amazônica de boas-vindas",
        "Welcome drink cortesia no Sunset Jungle Bar",
      ],
      pricing: {
        1: "R$ 8.732,50",
        2: "R$ 17.465,00",
        3: "R$ 23.796,00",
        4: "R$ 29.648,00",
      },
      total: "R$ 17.465,00",
      highlight:
        "Conforto, autenticidade e sabor regional. Viva a essência da floresta com acolhimento e comida caseira amazônica.",
    },
    {
      id: "uirapuru",
      name: "Pacote Uirapuru",
      duration: "5 dias e 4 noites",
      people: 2,
      experiences: [
        "Interação com botos",
        "Visita à aldeia local",
        "Caminhada na selva",
        "Focagem noturna de jacarés",
        "Pescaria de piranhas",
        "Pôr do sol no Jungle Bar",
        "Nascer do sol",
        "Doce amazônico artesanal",
        "Casa de farinha tradicional",
      ],
      inclusions: [
        "Alimentação: pensão completa",
        "Transporte terrestre e fluvial (ida e volta)",
        "Recepção amazônica de boas-vindas",
        "Welcome drink cortesia no Sunset Jungle Bar",
        "Jantar amazônico sob o Chapéu de Sol",
      ],
      pricing: {
        2: "R$ 16.410,00",
      },
      total: "R$ 16.410,00",
      highlight:
        "Um convite à serenidade e à cultura amazônica, com experiências únicas e gastronomia local inesquecível.",
    },
    {
      id: "ararauna",
      name: "Pacote Araraúna",
      duration: "7 dias e 6 noites",
      people: 2,
      experiences: [
        "Interação com botos",
        "Visita à aldeia local",
        "Caminhada na selva",
        "Focagem noturna de jacarés",
        "Pescaria de piranhas",
        "Nascer do sol",
        "Pôr do sol no Jungle Bar",
        "Macacos do Ariaú",
        "Doce amazônico artesanal",
        "Casa de farinha tradicional",
        "Passeio na cachoeira (em época de seca)",
        "Passeio na praia de água doce",
        "Samaúma gigante",
      ],
      inclusions: [
        "Alimentação: pensão completa",
        "Transporte terrestre e fluvial (ida e volta)",
        "Recepção amazônica de boas-vindas",
        "Welcome drink cortesia no Sunset Jungle Bar",
      ],
      pricing: {
        1: "R$ 12.667,50",
        2: "R$ 25.335,00",
        3: "R$ 34.402,00",
        4: "R$ 42.750,00",
      },
      total: "R$ 25.335,00",
      highlight:
        "O pacote mais completo e imersivo. Ideal para quem deseja mergulhar profundamente na natureza e cultura amazônica com conforto e exclusividade.",
    },
  ];

  const whatsappMessage = encodeURIComponent(
    "Olá! Gostaria de saber mais sobre o Pacote Gavião Panema personalizado."
  );

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
            href={`${SOCIAL_LINKS.whatsapp}?text=${whatsappMessage}`}
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
                      Pacote Gavião Panema
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                      Pacote 100% personalizável • Roteiro sob medida
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-4 py-2 rounded-full group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold text-sm sm:text-base">Falar com Consultor</span>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} {...pkg} />
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
