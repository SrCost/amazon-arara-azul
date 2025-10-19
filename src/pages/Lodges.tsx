import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import LodgeCard from "@/components/LodgeCard";
import lodge1 from "@/assets/lodge-1.jpg";
import lodge2 from "@/assets/lodge-2.jpg";
import lodge3 from "@/assets/lodge-3.jpg";
import lodge4 from "@/assets/lodge-4.jpg";

const Lodges = () => {
  const lodges = [
    {
      id: "canopy-retreat",
      name: "Canopy Retreat",
      location: "Reserva do Jaú, Amazonas",
      image: lodge1,
      price: "R$ 850",
      guests: 4,
      description:
        "Refúgio sustentável integrado à floresta, com vistas panorâmicas do dossel amazônico e arquitetura ecológica moderna.",
      amenities: ["wifi", "breakfast"],
    },
    {
      id: "rio-serenidade",
      name: "Rio Serenidade",
      location: "Beira do Rio Negro, AM",
      image: lodge2,
      price: "R$ 720",
      guests: 2,
      description:
        "Bangalô tradicional à beira do rio, com deck privativo, redes e vista privilegiada para o pôr do sol amazônico.",
      amenities: ["wifi", "breakfast"],
    },
    {
      id: "casa-arvore-esmeralda",
      name: "Casa na Árvore Esmeralda",
      location: "Parque Nacional, Amazonas",
      image: lodge3,
      price: "R$ 950",
      guests: 3,
      description:
        "Experiência única em casa circular suspensa nas árvores, envolta pela neblina matinal e cantos de aves exóticas.",
      amenities: ["wifi", "breakfast"],
    },
    {
      id: "flutuante-ama",
      name: "Flutuante AMA",
      location: "Lago do Jacaré, AM",
      image: lodge4,
      price: "R$ 1.200",
      guests: 4,
      description:
        "Lodge flutuante de design contemporâneo com energia solar, refletindo as cores do entardecer nas águas amazônicas.",
      amenities: ["wifi", "breakfast"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              Nossas Pousadas
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha sua experiência perfeita em meio à floresta amazônica
            </p>
          </div>

          <div className="flex justify-center">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Lodges Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lodges.map((lodge) => (
              <LodgeCard key={lodge.id} {...lodge} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Lodges;
