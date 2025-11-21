import { Link } from "react-router-dom";
import { MapPin, Users, Wifi, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LodgeCardProps {
  id: string;
  slug?: string;
  name: string;
  location: string;
  image: string;
  price: string;
  guests: number;
  description: string;
  amenities: string[];
}

const LodgeCard = ({
  id,
  slug,
  name,
  location,
  image,
  price,
  guests,
  description,
  amenities,
}: LodgeCardProps) => {
  const amenityIcons: { [key: string]: any } = {
    wifi: Wifi,
    breakfast: Coffee,
  };

  return (
    <Card className="overflow-hidden group hover:shadow-strong transition-all duration-300">
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-2xl font-display font-semibold text-foreground mb-2">
              {name}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1 text-accent" />
              {location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{price}</div>
            <div className="text-xs text-muted-foreground">por noite</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-accent" />
            {guests} pessoas
          </div>
          {amenities.slice(0, 2).map((amenity) => {
            const Icon = amenityIcons[amenity];
            return Icon ? (
              <div key={amenity} className="flex items-center">
                <Icon className="h-4 w-4 text-accent" />
              </div>
            ) : null;
          })}
        </div>

        <Button asChild className="w-full bg-gradient-forest hover:opacity-90">
          <Link to={`/bangalos/${slug || id}`}>Ver Detalhes</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default LodgeCard;
