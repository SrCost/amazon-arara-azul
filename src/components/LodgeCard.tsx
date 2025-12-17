import { Link } from "react-router-dom";
import { MapPin, Users, Wifi, Coffee, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LodgeCardProps {
  id: string;
  slug?: string;
  name: string;
  location: string;
  image?: string;
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
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            width={640}
            height={360}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Coffee className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-2">
          {name}
        </h3>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-accent flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl sm:text-2xl font-bold text-primary">{price}</span>
          <span className="text-xs text-muted-foreground">por noite</span>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center flex-wrap gap-3 sm:gap-4 mb-4 text-sm text-muted-foreground">
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

        <Button asChild className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 min-h-[48px] font-semibold">
          <Link to={`/bangalos/${slug || id}`}>
            <Calendar className="mr-2 h-4 w-4" />
            Consultar Disponibilidade
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default LodgeCard;
