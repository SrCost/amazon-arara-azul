import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import LodgeCard from "@/components/LodgeCard";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import lodge1 from "@/assets/lodge-1.jpg";
import lodge2 from "@/assets/lodge-2.jpg";
import lodge3 from "@/assets/lodge-3.jpg";
import lodge4 from "@/assets/lodge-4.jpg";

const lodgeImages = [lodge1, lodge2, lodge3, lodge4];

const Lodges = () => {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [lodges, setLodges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLodges = async () => {
      setLoading(true);
      try {
        const checkIn = searchParams.get("checkIn");
        const checkOut = searchParams.get("checkOut");
        const guests = searchParams.get("guests");

        // Get booked room IDs for the selected dates
        let bookedRoomIds: string[] = [];
        if (checkIn && checkOut) {
          const { data: reservations } = await supabase
            .from("reservations")
            .select("room_id")
            .in("status", ["confirmed", "pending"])
            .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`);
          
          bookedRoomIds = reservations?.map(r => r.room_id) || [];
        }

        // Build query for available rooms
        let query = supabase
          .from("rooms")
          .select("*")
          .eq("is_active", true);

        if (guests) {
          query = query.gte("max_guests", parseInt(guests));
        }

        // Exclude booked rooms
        if (bookedRoomIds.length > 0) {
          query = query.not("id", "in", `(${bookedRoomIds.join(",")})`);
        }

        const { data: rooms, error } = await query;

        if (error) throw error;

        // Map rooms to lodge format with localized content
        const mappedLodges = rooms?.map((room, index) => ({
          id: room.id,
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
  }, [searchParams, i18n.language]);

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
          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Buscando pousadas disponíveis...</p>
            </div>
          ) : lodges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                Nenhuma pousada disponível para o período informado.
              </p>
              <p className="text-sm text-muted-foreground">
                Tente outras datas ou reduza o número de hóspedes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lodges.map((lodge) => (
                <LodgeCard key={lodge.id} {...lodge} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Lodges;
