import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, Bird, Droplets, Users, Sunset, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Lightbox from "@/components/Lightbox";
import { useGalleryImages } from "@/hooks/useGalleryImages";

const Experiencias = () => {
  const { data: galleryImages = [], isLoading } = useGalleryImages("experiences");
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
      description:
        "Explore a floresta amazônica com guias especializados que compartilham o conhecimento ancestral da região.",
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
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              Experiências Amazônicas
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Conecte-se com a natureza através de experiências autênticas e inesquecíveis na maior floresta tropical do
              mundo.
            </p>
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {experiences.map((experience, index) => (
              <Card key={index} className="hover:shadow-medium transition-shadow">
                <CardContent className="p-5 sm:p-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-forest mb-4 sm:mb-6">
                    <experience.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-semibold mb-2 sm:mb-3 text-foreground">
                    {experience.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{experience.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Placeholder */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4">
              Galeria de Momentos
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Registros autênticos das experiências vividas em nosso bangalô
            </p>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma foto disponível no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer group"
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
          )}
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
