import { useState, useRef } from "react";
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
  const [lodgeType, setLodgeType] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckIn(e.target.value);
    // Auto-focus checkout after selecting check-in
    if (e.target.value) {
      setTimeout(() => {
        checkOutRef.current?.focus();
        checkOutRef.current?.showPicker?.();
      }, 100);
    }
  };

  const handleSearch = async () => {
    if (!checkIn || !checkOut || !guests || !lodgeType) {
      toast({
        title: t("common.error"),
        description: t("search.fillAllFields", "Preencha todos os campos para buscar"),
        variant: "destructive"
      });
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      toast({
        title: t("common.error"),
        description: t("search.checkoutAfterCheckin", "A data de check-out deve ser após o check-in"),
        variant: "destructive"
      });
      return;
    }
    const guestsNum = parseInt(guests);
    if (guestsNum > 4) {
      toast({
        title: t("common.error"),
        description: t("search.maxGuests", "Máx. 4 hóspedes por acomodação"),
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
        // Navigate to bangalos page with search params
        navigate(`/bangalos?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&type=${lodgeType}`);
        toast({
          title: t("search.searchComplete", "Busca realizada!"),
          description: t("search.availableRooms", { count: rooms.length, defaultValue: `${rooms.length} acomodação(ões) disponível(is) para suas datas.` })
        });
      } else {
        toast({
          title: t("search.unavailable", "Indisponível"),
          description: t("search.noRoomsAvailable", "Nenhuma acomodação disponível para as datas selecionadas. Escolha outras datas ou reduza o número de hóspedes."),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: t("common.error"),
        description: t("search.searchError", "Erro ao buscar acomodações. Tente novamente."),
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-card shadow-medium rounded-lg p-3 sm:p-4 md:p-6 w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        {/* Check-in */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs sm:text-sm font-medium text-foreground flex items-center">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary flex-shrink-0" />
            <span>{t("search.checkIn", "Check-in")}</span>
          </label>
          <Input 
            type="date" 
            value={checkIn} 
            onChange={handleCheckInChange} 
            min={new Date().toISOString().split('T')[0]} 
            className="w-full min-w-0 text-sm h-9 sm:h-10" 
          />
        </div>

        {/* Check-out */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs sm:text-sm font-medium text-foreground flex items-center">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary flex-shrink-0" />
            <span>{t("search.checkOut", "Check-out")}</span>
          </label>
          <Input 
            ref={checkOutRef}
            type="date" 
            value={checkOut} 
            onChange={e => setCheckOut(e.target.value)} 
            min={checkIn || new Date().toISOString().split('T')[0]} 
            className="w-full min-w-0 text-sm h-9 sm:h-10" 
          />
        </div>

        {/* Hóspedes */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs sm:text-sm font-medium text-foreground flex items-center">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary flex-shrink-0" />
            <span>{t("search.guests", "Hóspedes")}</span>
          </label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="h-9 sm:h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 {t("search.person", "pessoa")}</SelectItem>
              <SelectItem value="2">2 {t("search.people", "pessoas")}</SelectItem>
              <SelectItem value="3">3 {t("search.people", "pessoas")}</SelectItem>
              <SelectItem value="4">4 {t("search.people", "pessoas")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bangalôs */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs sm:text-sm font-medium text-foreground flex items-center">
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-primary flex-shrink-0" />
            <span>{t("search.lodges", "Bangalôs")}</span>
          </label>
          <Select value={lodgeType} onValueChange={setLodgeType}>
            <SelectTrigger className="h-9 sm:h-10 text-sm">
              <SelectValue placeholder={t("search.all", "Todos")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("search.all", "Todos")}</SelectItem>
              <SelectItem value="bangalo-peneira">Bangalô Peneira</SelectItem>
              <SelectItem value="bangalo-paneiro">Bangalô Paneiro</SelectItem>
              <SelectItem value="bangalo-tipiti">Bangalô Tipiti</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão Buscar - ocupa 2 colunas em mobile */}
        <div className="col-span-2 lg:col-span-1 flex items-end mt-1 sm:mt-0">
          <Button 
            onClick={handleSearch} 
            disabled={isSearching} 
            className="w-full h-9 sm:h-10 bg-gradient-forest hover:opacity-90 transition-opacity text-sm sm:text-base"
          >
            {isSearching ? t("search.searching", "Buscando...") : t("search.search", "Buscar")}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default SearchBar;