import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, Bird, Droplets, Users, Sunset, Camera } from "lucide-react";
import Lightbox from "@/components/Lightbox";
import { galleryImages } from "@/config/galleryImages";

const Experiencias = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const experiences = [
    {
      icon: Compass,
      title: "Trilhas Guiadas",
      description: "Explore a floresta amazônica com guias especializados que compartilham o conhecimento ancestral da região.",
    },
    {
      icon: Bird,
      title: "Observação de Aves",
      description: "Descubra a incrível biodiversidade de aves tropicais em seu habitat natural ao amanhecer.",
    },
    {
      icon: Droplets,
      title: "Passeios de Canoa",
      description: "Navegue pelos igarapés e rios em canoas tradicionais, vivenciando a paz das águas amazônicas.",
    },
    {
      icon: Users,
      title: "Visitas às Comunidades",
      description: "Conheça a cultura local e as tradições das comunidades ribeirinhas da Amazônia.",
    },
    {
      icon: Sunset,
      title: "Pôr do Sol no Rio",
      description: "Admire espetáculos naturais únicos com o pôr do sol refletindo nas águas do Rio Negro.",
    },
    {
      icon: Camera,
      title: "Fotografia de Natureza",
      description: "Capture momentos inesquecíveis da fauna e flora amazônica em cenários paradisíacos.",
    },
  ];


  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6">
              Experiências Amazônicas
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Conecte-se com a natureza através de experiências autênticas e inesquecíveis
              na maior floresta tropical do mundo.
            </p>
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {experiences.map((experience, index) => (
              <Card key={index} className="hover:shadow-medium transition-shadow">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-forest mb-6">
                    <experience.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-3 text-foreground">
                    {experience.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {experience.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Placeholder */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Galeria de Momentos
            </h2>
            <p className="text-lg text-muted-foreground">
              Registros autênticos das experiências vividas em nossa pousada
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <Lightbox
          images={galleryImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}

      <Footer />
    </div>
  );
};

export default Experiencias;
