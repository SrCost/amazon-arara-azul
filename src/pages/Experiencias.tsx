import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, Bird, Droplets, Users, Sunset, Camera, ChevronDown, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";

import Lightbox from "@/components/Lightbox";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";

const Experiencias = () => {
  const { t } = useTranslation();
  
  usePageMeta({
    title: t('pages.experiencesTitle'),
    description: t('pages.experiencesDesc'),
  });

  const { data: galleryImages = [], isLoading } = useGalleryImages("experiences");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const scrollToGallery = () => {
    document.getElementById('gallery-full')?.scrollIntoView({ behavior: 'smooth' });
  };

  const experiences = [
    {
      icon: Compass,
      title: t("experiences.guidedTrails"),
      description: t("experiences.guidedTrailsDesc"),
    },
    {
      icon: Bird,
      title: t("experiences.birdWatching"),
      description: t("experiences.birdWatchingDesc"),
    },
    {
      icon: Droplets,
      title: t("experiences.canoeTrips"),
      description: t("experiences.canoeTripsDesc"),
    },
    {
      icon: Users,
      title: t("experiences.communityVisits"),
      description: t("experiences.communityVisitsDesc"),
    },
    {
      icon: Sunset,
      title: t("experiences.riverSunset"),
      description: t("experiences.riverSunsetDesc"),
    },
    {
      icon: Camera,
      title: t("experiences.naturePhotography"),
      description: t("experiences.naturePhotographyDesc"),
    },
  ];

  // Preview images for mobile (first 4 images)
  const previewImages = galleryImages.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-4 sm:pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">
              {t("experiences.title")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("experiences.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Preview - Mobile First */}
      <section className="py-3 sm:py-8 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
              📸 {t("experiences.galleryTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("experiences.gallerySubtitle")}
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : previewImages.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {previewImages.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      width={400}
                      height={225}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              {galleryImages.length > 4 && (
                <div className="text-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={scrollToGallery}
                    className="gap-2"
                  >
                    <span>{t("experiences.viewAllPhotos", { count: galleryImages.length })}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : null}
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

      {/* Full Gallery */}
      <section id="gallery-full" className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4">
              {t("experiences.fullGalleryTitle")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              {t("experiences.fullGallerySubtitle")}
            </p>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("experiences.noPhotos")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer group"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={640}
                    height={360}
                    decoding="async"
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