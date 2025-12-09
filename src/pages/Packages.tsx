import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import { useTranslation } from "react-i18next";

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
      total: "R$ 8.832,60",
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
      total: "R$ 8.676,60",
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
      total: "R$ 12.827,40",
      highlight:
        "O pacote mais completo e imersivo. Ideal para quem deseja mergulhar profundamente na natureza e cultura amazônica com conforto e exclusividade.",
    },
    {
      id: "gaviao-panema",
      name: "Pacote Gavião Panema",
      duration: "Personalizado",
      people: 2,
      experiences: [
        "Roteiro totalmente personalizado",
        "Atividades à sua escolha",
        "Experiências exclusivas sob medida",
      ],
      inclusions: [
        "Consultoria personalizada",
        "Itinerário sob medida",
        "Suporte dedicado",
        "Experiências exclusivas",
      ],
      total: "Sob Consulta",
      highlight:
        "Pacote exclusivo e personalizável criado junto a um consultor especializado. Ideal para quem deseja uma experiência sob medida na Amazônia.",
      isCustomizable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">{t("packages.title")}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">{t("packages.subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8 mb-16">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} {...pkg} />
            ))}
          </div>

          {/* Final Section */}
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12 border border-border">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">{t("packages.qualityTitle")}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{t("packages.qualityDescription")}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Packages;
