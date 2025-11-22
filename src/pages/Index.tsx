import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Leaf, Shield, Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import LodgeCard from "@/components/LodgeCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import FindUsSection from "@/components/FindUsSection";
import heroImage from "@/assets/hero-bungalow.jpg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const { t, i18n } = useTranslation();
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

        // Fetch gallery images for each room
        const { data: galleryImages } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        // Map rooms to lodge format with localized content
        const mappedLodges = rooms?.map((room) => {
          // Find the first gallery image for this bungalow
          const firstImage = galleryImages?.find(
            (img) => img.bungalow_slug === room.slug
          );
          
          const imageUrl = firstImage
            ? `${SUPABASE_URL}/storage/v1/object/public/gallery/${firstImage.storage_path}`
            : undefined;

          return {
            id: room.id,
            slug: room.slug || room.id,
            name: room[`name_${i18n.language}`] || room.name_pt,
            location: "MANACAPURU, AMAZONIA - AM",
            image: imageUrl,
            price: `R$ ${room.price_per_night}`,
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

      {/* Hero Section with Static Image */}
      <section className="relative">
        <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
          {/* Static Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          
          {/* Dark Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 z-10">
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 text-balance animate-fade-in drop-shadow-lg">
                  {t("home.heroTitle")}
                </h1>
                <p className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl mx-auto text-balance drop-shadow-md">
                  {t("home.heroSubtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-gradient-forest hover:opacity-90 text-lg h-14 px-8" asChild>
                  <Link to="/bangalos">
                    Explorar Bangalôs
                    <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 text-lg h-14 px-8"
                    asChild>
                    <Link to="/sustentabilidade">{t("home.ourMission")}</Link>
                  </Button>
                </div>

                <div className="flex justify-center -mb-20">
                  <SearchBar />
                </div>
              </div>
            </div>
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
                <h3 className="text-2xl font-display font-bold mb-3 text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
              Nossos Bangalôs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conheça nossos bangalôs exclusivos em meio à floresta amazônica
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Carregando bangalôs...</p>
            </div>
          ) : lodges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Nenhum bangalô disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {lodges.map((lodge) => (
                <LodgeCard key={lodge.id} {...lodge} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/bangalos">
                Ver Todos os Bangalôs
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Find Us Section */}
      <FindUsSection />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-forest text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            {t("home.readyForAdventure")}
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            {t("home.bookNowDescription")}
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg h-14 px-8"
            asChild
          >
            <Link to="/contato">{t("home.getInTouch")}</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
