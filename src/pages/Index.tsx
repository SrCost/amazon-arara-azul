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
import heroImage from "@/assets/hero-amazon.jpg";
import lodge1 from "@/assets/lodge-1.jpg";
import lodge2 from "@/assets/lodge-2.jpg";
import lodge3 from "@/assets/lodge-3.jpg";
import lodge4 from "@/assets/lodge-4.jpg";

const lodgeImages = [lodge1, lodge2, lodge3, lodge4];

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

        // Map rooms to lodge format with localized content
        const mappedLodges = rooms?.map((room, index) => ({
          id: room.id,
          slug: room.slug || room.id,
          name: room[`name_${i18n.language}`] || room.name_pt,
          location: "MANACAPURU, AMAZONIA - AM",
          image: lodgeImages[index % lodgeImages.length],
          price: `R$ ${room.price_per_night}`,
          guests: room.max_guests,
          description: room[`description_${i18n.language}`] || room.description_pt,
          amenities: room.amenities || ["wifi", "breakfast"],
        })) || [];

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
            {t("home.heroTitle")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto text-balance">
            {t("home.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-forest hover:opacity-90 text-lg h-14 px-8" asChild>
              <Link to="/pousadas">
                {t("home.exploreLodges")}
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 text-lg h-14 px-8"
              asChild
            >
              <Link to="/sustentabilidade">{t("home.ourMission")}</Link>
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
              {t("home.ourLodges")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.lodgesDescription")}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Carregando pousadas...</p>
            </div>
          ) : lodges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Nenhuma pousada disponível no momento.</p>
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
              <Link to="/pousadas">
                {t("home.viewAllLodges")}
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
