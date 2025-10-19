import { useState } from "react";
import { Calendar, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SearchBar = () => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [lodgeType, setLodgeType] = useState("");

  const handleSearch = () => {
    console.log({ checkIn, checkOut, guests, lodgeType });
  };

  return (
    <div className="bg-card shadow-medium rounded-lg p-6 w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            Check-in
          </label>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            Check-out
          </label>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full"
          />
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
              <SelectItem value="4">4 pessoas</SelectItem>
              <SelectItem value="5">5+ pessoas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Home className="h-4 w-4 mr-2 text-primary" />
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
          <Button
            onClick={handleSearch}
            className="w-full h-10 bg-gradient-forest hover:opacity-90 transition-opacity"
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
