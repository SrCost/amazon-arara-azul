import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Users, Wifi, Coffee, Tv, Wind, ArrowLeft, Star, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ReservationFlow from "@/components/ReservationFlow";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import Lightbox from "@/components/Lightbox";
import lodge1 from "@/assets/lodge-1.jpg";
import lodge2 from "@/assets/lodge-2.jpg";
import lodge3 from "@/assets/lodge-3.jpg";
import lodge4 from "@/assets/lodge-4.jpg";

const LodgeDetail = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [showReservation, setShowReservation] = useState(false);
  const [lodge, setLodge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bungalowSlug, setBungalowSlug] = useState<string>("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Buscar fotos do bangalô específico
  const { data: bungalowImages = [] } = useGalleryImages("bungalows", bungalowSlug || undefined);

  // Combine gallery images with fallback images
  const allImages =
    bungalowImages.length > 0
      ? bungalowImages
      : lodge?.images?.map((img: string, idx: number) => ({
          src: img,
          alt: `${lodge?.name} - Imagem ${idx + 1}`,
          id: `fallback-${idx}`,
        })) || [];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  useEffect(() => {
    fetchLodgeDetails();
  }, [id, i18n.language]);

  const fetchLodgeDetails = async () => {
    try {
      // Try to fetch by slug first, fallback to id
      let query = supabase.from("rooms").select("*").eq("is_active", true);

      // Check if id looks like a UUID or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");

      if (isUUID) {
        query = query.eq("id", id);
      } else {
        query = query.eq("slug", id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Bangalô não encontrado");
        return;
      }

      // Set bungalow slug for fetching images
      if (data.slug) {
        setBungalowSlug(data.slug);
      }

      // Map database fields to component format
      const currentLang = i18n.language;
      const lodgeData = {
        id: data.id,
        slug: data.slug,
        name: data[`name_${currentLang}`] || data.name_pt,
        location: "MANACAPURU, AMAZONIA - AM",
        images: data.image_url ? [data.image_url, lodge1, lodge2] : [lodge1, lodge2, lodge3],
        price: `R$ ${data.price_per_night.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pricePerNight: Number(data.price_per_night),
        guests: data.max_guests,
        description: data[`description_${currentLang}`] || data.description_pt,
        amenities: data.amenities || [
          "Wi-Fi de alta velocidade",
          "Café da manhã incluído",
          "Ar condicionado",
          "Varanda privativa",
          "Energia solar",
        ],
        experiences: [
          "Trilhas guiadas na floresta",
          "Observação de aves",
          "Passeios de canoa",
          "Visita a comunidades locais",
        ],
        rating: 4.9,
        reviews: 127,
      };

      setLodge(lodgeData);
    } catch (error) {
      console.error("Error fetching lodge:", error);
      toast.error("Erro ao carregar detalhes do bangalô");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <p className="text-lg">Carregando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!lodge) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <Button variant="ghost" asChild className="mt-4">
            <Link to="/bangalos">
              <ArrowLeft className="mr-2" />
              Voltar para bangalôs
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const amenityIcons: { [key: string]: any } = {
    "Wi-Fi de alta velocidade": Wifi,
    "Café da manhã incluído": Coffee,
    "Ar condicionado": Wind,
    "Varanda privativa": Tv,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/bangalos">
              <ArrowLeft className="mr-2" />
              {t("lodge.backToLodges")}
            </Link>
          </Button>

          {/* Gallery Section - Modern Hero + Grid Layout */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl overflow-hidden">
              {/* Hero Image - 2x2 grid space on desktop */}
              <div 
                className="md:col-span-2 md:row-span-2 relative aspect-[4/3] cursor-pointer group overflow-hidden"
                onClick={() => openLightbox(0)}
              >
                <img
                  src={allImages[0]?.src}
                  alt={allImages[0]?.alt}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm font-medium">
                    Clique para ampliar
                  </span>
                </div>
              </div>

              {/* Secondary Images Grid 2x2 */}
              {allImages.slice(1, 5).map((image: any, index: number) => (
                <div
                  key={image.id || index}
                  className="relative aspect-[4/3] cursor-pointer group overflow-hidden"
                  onClick={() => openLightbox(index + 1)}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
              ))}

              {/* "View all photos" button - last grid position */}
              {allImages.length > 5 && (
                <div
                  className="relative aspect-[4/3] cursor-pointer group overflow-hidden"
                  onClick={() => openLightbox(5)}
                >
                  <img
                    src={allImages[5]?.src}
                    alt={allImages[5]?.alt}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-all duration-300 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-white text-lg font-semibold block">
                        Ver todas as fotos
                      </span>
                      <span className="text-white/80 text-sm">
                        +{allImages.length - 5} fotos
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">{lodge.name}</h1>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 fill-golden text-golden" />
                    <span className="font-semibold">{lodge.rating}</span>
                    <span className="text-muted-foreground">
                      ({lodge.reviews} {t("lodge.reviews")})
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-muted-foreground mb-6">
                  <MapPin className="h-5 w-5 mr-2 text-accent" />
                  {lodge.location}
                </div>

                <p className="text-lg text-foreground leading-relaxed">{lodge.description}</p>
              </div>

              {/* Amenities */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-display font-semibold mb-4">{t("lodge.amenities")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lodge.amenities.map((amenity: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Experiences */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-display font-semibold mb-4">{t("lodge.experiences")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lodge.experiences.map((exp: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                        <span className="text-foreground">{exp}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Availability Calendar */}
              <AvailabilityCalendar roomId={lodge.id} />
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-28 shadow-medium">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-primary mb-1">{lodge.price}</div>
                    <div className="text-sm text-muted-foreground">{t("common.perNight")}</div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-foreground">
                      <Users className="h-5 w-5 mr-3 text-accent" />
                      {t("lodge.upTo")} {lodge.guests} {t("common.guests")}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-forest hover:opacity-90 h-12 text-lg mb-4"
                    onClick={() => setShowReservation(true)}
                  >
                    {t("common.bookNow")}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">{t("lodge.notChargedYet")}</p>

                  <div className="border-t border-border mt-6 pt-6">
                    <h3 className="font-semibold mb-3">{t("lodge.cancellationPolicy")}</h3>
                    <p className="text-sm text-muted-foreground">{t("lodge.cancellationText")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Reservation Dialog */}
      <Dialog open={showReservation} onOpenChange={setShowReservation}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ReservationFlow
            lodgeName={lodge.name}
            pricePerNight={lodge.pricePerNight || parseInt(lodge.price.replace(/[^\d]/g, ""))}
            roomId={lodge.id || id || ""}
            onClose={() => setShowReservation(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={allImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}
    </div>
  );
};

export default LodgeDetail;
