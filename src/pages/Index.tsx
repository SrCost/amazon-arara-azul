import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Leaf, Shield, Heart, Calendar } from "lucide-react";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import LodgeCard from "@/components/LodgeCard";
import CTASection from "@/components/CTASection";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import FindUsSection from "@/components/FindUsSection";
import GoogleReviewsCarousel from "@/components/GoogleReviewsCarousel";
import LeaveReviewSection from "@/components/LeaveReviewSection";
import HeroVideoSection from "@/components/landing/HeroVideoSection";

// Fallback cover images
import tipitiExterior from "@/assets/tipiti-exterior.jpg";
import peneiraBedroom from "@/assets/peneira-bedroom.jpg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Fallback cover images map
const fallbackCoverImages: Record<string, string> = {
  'bangalo-tipiti': tipitiExterior,
  'bangalo-peneira': peneiraBedroom,
};

const Index = () => {
  const { t, i18n } = useTranslation();
  const [hideHeroOverlay, setHideHeroOverlay] = useState(false);
  const [lodges, setLodges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLodges = async () => {
      try {
        const { data: rooms, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Fetch gallery images with display_order = 1 (cover images)
        const { data: galleryImages } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("category", "bungalows")
          .eq("is_active", true)
          .eq("display_order", 1);

        // Map rooms to lodge format with localized content
        const mappedLodges = rooms?.map((room) => {
          // Find the first gallery image for this bungalow
          const firstImage = galleryImages?.find(
            (img) => img.bungalow_slug === room.slug
          );
          
          // Use gallery image, or fallback to local image
          const imageUrl = firstImage
            ? `${SUPABASE_URL}/storage/v1/object/public/gallery/${firstImage.storage_path}`
            : (room.slug ? fallbackCoverImages[room.slug] : undefined);

          return {
            id: room.id,
            slug: room.slug || room.id,
            name: room[`name_${i18n.language}`] || room.name_pt,
            location: t('lodgeDetail.location'),
            image: imageUrl,
            price: `${t('lodgeDetail.fromPrice')} R$ ${room.price_per_night.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            guests: room.max_guests,
            description: room[`description_${i18n.language}`] || room.description_pt,
            amenities: room.amenities || ["wifi", "breakfast"],
          };
        }) || [];

        setLodges(mappedLodges);
      } catch (error) {
        console.error("Error fetching lodges:", error);
        setLodges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLodges();
  }, [i18n.language]);

  const features = [
    {
      icon: Leaf,
      title: t("home.sustainable"),
      description: t("home.sustainableDesc"),
    },
    {
      icon: Shield,
      title: t("home.conservation"),
      description: t("home.conservationDesc"),
    },
    {
      icon: Heart,
      title: t("home.localCommunity"),
      description: t("home.localCommunityDesc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section with Carousel */}
      <section className="relative">
        <div className="relative w-full h-[400px] sm:h-[550px] md:h-[650px] lg:h-[700px] overflow-hidden">
          <HeroCarousel onSlideChange={setHideHeroOverlay} />
          
          {/* Content Overlay */}
          <div className={`absolute inset-0 z-10 transition-opacity duration-500 will-change-[opacity] ${
            hideHeroOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}>
            <div className="flex items-center justify-center h-full">
            <div className="text-center px-6 max-w-4xl mx-auto pt-20 sm:pt-16 md:pt-8 lg:pt-0">
                <h1 className="text-lg xs:text-xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-display font-bold text-white mb-4 sm:mb-6 text-balance animate-fade-in-up drop-shadow-lg leading-snug">
                  {t("home.heroTitle")}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 mb-6 sm:mb-8 max-w-2xl mx-auto text-balance drop-shadow-md px-2 opacity-0 animate-fade-in-up [animation-delay:100ms]">
                  {t("home.heroSubtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 px-4 opacity-0 animate-fade-in-up [animation-delay:200ms]">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white text-base sm:text-lg h-14 sm:h-16 px-8 sm:px-10 font-semibold shadow-lg hover:shadow-xl transition-all animate-glow-pulse" 
                    asChild
                  >
                    <Link to="/bangalos">
                      <Calendar className="mr-2 h-5 w-5" />
                      {t("nav.bookNow")}
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 text-base sm:text-lg h-14 sm:h-16 px-6 sm:px-8"
                    asChild>
                    <Link to="/sustentabilidade">{t("home.ourMission")}</Link>
                  </Button>
                </div>

                {/* SearchBar - Desktop only */}
                <div className="hidden sm:flex justify-center sm:-mb-10 lg:-mb-20 px-2">
                  <SearchBar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SearchBar Mobile - Outside hero */}
      <div className="sm:hidden px-4 -mt-6 relative z-20">
        <SearchBar />
      </div>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card p-5 sm:p-6 lg:p-8 rounded-lg shadow-soft hover:shadow-medium transition-shadow text-center opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 100 + 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-forest mb-3 sm:mb-4">
                  <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-display font-bold mb-2 sm:mb-3 text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviewsCarousel />

      {/* CTA after Features */}
      <CTASection variant="secondary" buttonText={t("home.viewAvailableLodges")} buttonLink="/bangalos" />

      {/* Lodges Section */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4 opacity-0 animate-fade-in-up">
              {t("home.ourLodges")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-in-up [animation-delay:100ms]">
              {t("home.lodgesDescription")}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-base sm:text-lg text-muted-foreground">{t("home.loadingLodges")}</p>
            </div>
          ) : lodges.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-base sm:text-lg text-muted-foreground">{t("home.noLodgesAvailable")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {lodges.map((lodge) => (
                <LodgeCard key={lodge.id} {...lodge} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-gradient-forest hover:opacity-90 min-h-[52px] px-8"
              asChild
            >
              <Link to="/bangalos">
                {t("home.checkAvailability")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <CTASection variant="whatsapp" description={t("home.preferDirectContact")} />

      {/* Leave a Review */}
      <LeaveReviewSection />

      {/* Find Us Section */}
      <FindUsSection />

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-forest text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 sm:mb-6">
            {t("home.readyForAdventure")}
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90">
            {t("home.bookNowDescription")}
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg h-14 sm:h-16 px-8 sm:px-10 font-semibold shadow-lg"
            asChild
          >
            <Link to="/bangalos">
              <Calendar className="mr-2 h-5 w-5" />
              {t("home.makeReservation")}
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;