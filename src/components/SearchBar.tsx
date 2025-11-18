import { useState } from "react";
import { Calendar, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const SearchBar = () => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [lodgeType, setLodgeType] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  const handleSearch = async () => {
    if (!checkIn || !checkOut || !guests || !lodgeType) {
      toast({
        title: t("common.error"),
        description: "Preencha todos os campos para buscar",
        variant: "destructive"
      });
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      toast({
        title: t("common.error"),
        description: "A data de check-out deve ser após o check-in",
        variant: "destructive"
      });
      return;
    }
    const guestsNum = parseInt(guests);
    if (guestsNum > 3) {
      toast({
        title: t("common.error"),
        description: "Máx. 3 hóspedes por acomodação",
        variant: "destructive"
      });
      return;
    }
    setIsSearching(true);
    try {
      // Check for conflicting reservations
      const {
        data: reservations,
        error: reservationsError
      } = await supabase.from("reservations").select("room_id").in("status", ["confirmed", "pending"]).or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`);
      if (reservationsError) throw reservationsError;
      const bookedRoomIds = reservations?.map(r => r.room_id) || [];

      // Build query for available rooms
      let query = supabase.from("rooms").select("*").eq("is_active", true).gte("max_guests", parseInt(guests));

      // Exclude booked rooms
      if (bookedRoomIds.length > 0) {
        query = query.not("id", "in", `(${bookedRoomIds.join(",")})`);
      }
      const {
        data: rooms,
        error: roomsError
      } = await query;
      if (roomsError) throw roomsError;
      if (rooms && rooms.length > 0) {
        // Navigate to pousadas page with search params
        navigate(`/pousadas?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&type=${lodgeType}`);
        toast({
          title: "Busca realizada!",
          description: `${rooms.length} acomodação(ões) disponível(is) para suas datas.`
        });
      } else {
        toast({
          title: "Indisponível",
          description: "Nenhuma acomodação disponível para as datas selecionadas. Escolha outras datas ou reduza o número de hóspedes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: t("common.error"),
        description: "Erro ao buscar acomodações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };
  return <div className="bg-card shadow-medium rounded-lg p-6 w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            Check-in
          </label>
          <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full" />
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            Check-out
          </label>
          <Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} className="w-full" />
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            Hóspedes
          </label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 pessoa</SelectItem>
              <SelectItem value="2">2 pessoas</SelectItem>
              <SelectItem value="3">3 pessoas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">Tipos de Bangalôs  <Home className="h-4 w-4 mr-2 text-primary" />
            Tipo de Pousada
          </label>
          <Select value={lodgeType} onValueChange={setLodgeType}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="riverside">Beira-Rio</SelectItem>
              <SelectItem value="treehouse">Casa na Árvore</SelectItem>
              <SelectItem value="floating">Flutuante</SelectItem>
              <SelectItem value="canopy">No Dossel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleSearch} disabled={isSearching} className="w-full h-10 bg-gradient-forest hover:opacity-90 transition-opacity">
            {isSearching ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>
    </div>;
};
export default SearchBar;