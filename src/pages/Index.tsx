import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Shield, Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import LodgeCard from "@/components/LodgeCard";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-amazon.jpg";
import lodge1 from "@/assets/lodge-1.jpg";
import lodge2 from "@/assets/lodge-2.jpg";
import lodge3 from "@/assets/lodge-3.jpg";
import lodge4 from "@/assets/lodge-4.jpg";

const Index = () => {
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

  const features = [
    {
      icon: Leaf,
      title: "100% Sustentável",
      description:
        "Energia solar, tratamento de resíduos e arquitetura de baixo impacto ambiental",
    },
    {
      icon: Shield,
      title: "Conservação Ativa",
      description:
        "Parte da receita destinada à proteção da floresta e biodiversidade local",
    },
    {
      icon: Heart,
      title: "Comunidade Local",
      description:
        "Apoio direto às famílias ribeirinhas e valorização da cultura amazônica",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 text-balance animate-fade-in">
            Viva a Amazônia com Responsabilidade
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto text-balance">
            Hospedagem ecológica em meio à maior floresta tropical do planeta. Uma imersão única
            que une conforto, natureza e sustentabilidade.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-forest hover:opacity-90 text-lg h-14 px-8" asChild>
              <Link to="/pousadas">
                Explorar Pousadas
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 text-lg h-14 px-8"
              asChild
            >
              <Link to="/sustentabilidade">Nossa Missão</Link>
            </Button>
          </div>

          <div className="flex justify-center -mb-20">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card p-8 rounded-lg shadow-soft hover:shadow-medium transition-shadow text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-forest mb-4">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lodges Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Nossas Pousadas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada pousada oferece uma experiência autêntica, integrada à natureza e à cultura
              local
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {lodges.map((lodge) => (
              <LodgeCard key={lodge.id} {...lodge} />
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/pousadas">
                Ver Todas as Pousadas
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-forest text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Pronto para Sua Aventura Amazônica?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Reserve agora e garanta sua experiência inesquecível em uma das regiões mais
            biodiversas do mundo
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg h-14 px-8"
            asChild
          >
            <Link to="/contato">Entre em Contato</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
