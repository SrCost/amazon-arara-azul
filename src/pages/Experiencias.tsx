import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Compass, Bird, Droplets, Users, Sunset, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import Lightbox from "@/components/Lightbox";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { usePageMeta } from "@/hooks/usePageMeta";
import ImmersiveHero from "@/components/experiences/ImmersiveHero";
import ExperienceCard from "@/components/experiences/ExperienceCard";
import IrregularGallery from "@/components/experiences/IrregularGallery";
import WaveDivider from "@/components/WaveDivider";
import trilhasGuiadas from "@/assets/experiences/trilhas_guiadas.jpg.asset.json";
import observacaoAves from "@/assets/experiences/observacao_de_aves.jpeg.asset.json";
import passeioCanoa from "@/assets/experiences/passeio_de_canoa.png.asset.json";
import visitasComunidades from "@/assets/experiences/visitas_as_comunidades.jpg.asset.json";
import porDoSol from "@/assets/experiences/por_do_sol.jpeg.asset.json";
import fotografiasNatureza from "@/assets/experiences/fotografias_de_natureza.jpg.asset.json";

const Experiencias = () => {
  const { t } = useTranslation();

  usePageMeta({
    title: t("pages.experiencesTitle"),
    description: t("pages.experiencesDesc"),
  });

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
      category: "Aventura",
      title: t("experiences.guidedTrails"),
      description: t("experiences.guidedTrailsDesc"),
      image: { src: trilhasGuiadas.url, alt: t("experiences.guidedTrails") },
    },
    {
      icon: Bird,
      category: "Fauna",
      title: t("experiences.birdWatching"),
      description: t("experiences.birdWatchingDesc"),
      image: { src: observacaoAves.url, alt: t("experiences.birdWatching") },
    },
    {
      icon: Droplets,
      category: "Águas",
      title: t("experiences.canoeTrips"),
      description: t("experiences.canoeTripsDesc"),
      image: { src: passeioCanoa.url, alt: t("experiences.canoeTrips") },
    },
    {
      icon: Users,
      category: "Cultura",
      title: t("experiences.communityVisits"),
      description: t("experiences.communityVisitsDesc"),
      image: { src: visitasComunidades.url, alt: t("experiences.communityVisits") },
    },
    {
      icon: Sunset,
      category: "Natureza",
      title: t("experiences.riverSunset"),
      description: t("experiences.riverSunsetDesc"),
      image: { src: porDoSol.url, alt: t("experiences.riverSunset") },
    },
    {
      icon: Camera,
      category: "Momentos",
      title: t("experiences.naturePhotography"),
      description: t("experiences.naturePhotographyDesc"),
      image: { src: fotografiasNatureza.url, alt: t("experiences.naturePhotography") },
    },
  ];

  const heroImages = galleryImages.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Section 1 — Immersive Hero */}
      <section className="pt-24 sm:pt-28 pb-8 sm:pb-12 bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-foreground mb-3 sm:mb-4">
              {t("experiences.title")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("experiences.subtitle")}
            </p>
          </div>

          {isLoading ? (
            <Skeleton className="w-full h-[320px] sm:h-[400px] rounded-2xl" />
          ) : (
            <ImmersiveHero
              images={heroImages}
              onSlideClick={(i) => openLightbox(i)}
            />
          )}
        </div>
      </section>

      <WaveDivider />

      {/* Section 2 — Experience Cards */}
      <section className="py-12 sm:py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              {t("experiences.galleryTitle")}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {t("experiences.gallerySubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {experiences.map((exp, index) => (
              <ExperienceCard
                key={index}
                icon={exp.icon}
                title={exp.title}
                description={exp.description}
                category={exp.category}
                image={exp.image}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <WaveDivider flip />

      {/* Section 3 — Full Gallery (irregular grid) */}
      <section id="gallery-full" className="py-12 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              {t("experiences.fullGalleryTitle")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t("experiences.fullGallerySubtitle")}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[200px]">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="w-full h-full rounded-xl" />
              ))}
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("experiences.noPhotos")}</p>
            </div>
          ) : (
            <IrregularGallery images={galleryImages} onOpen={openLightbox} />
          )}
        </div>
      </section>

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
