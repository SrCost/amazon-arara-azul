import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Wifi,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lodge {
  id: string;
  slug: string;
  name: string;
  location: string;
  image?: string;
  guests: number;
  description: string;
  amenities: string[];
}

interface BungalowCarouselProps {
  lodges: Lodge[];
}

const AUTOPLAY_MS = 4000;

const BungalowCarousel = ({ lodges }: BungalowCarouselProps) => {
  const { t } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const isPausedRef = useRef(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Autoplay with prefers-reduced-motion respect + pause on hover/touch
  useEffect(() => {
    if (!emblaApi) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      if (!isPausedRef.current) emblaApi.scrollNext();
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [emblaApi]);

  const pause = () => {
    isPausedRef.current = true;
  };
  const resume = () => {
    isPausedRef.current = false;
  };

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();
  const scrollTo = (i: number) => emblaApi?.scrollTo(i);

  return (
    <div
      className="relative"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className="overflow-hidden px-[7.5%] sm:px-0" ref={emblaRef}>
        <div className="flex -ml-4">
          {lodges.map((lodge) => (
            <div
              key={lodge.id}
              className="pl-4 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%] min-w-0"
            >
              <CarouselCard lodge={lodge} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows (desktop/tablet) */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Anterior"
        className="hidden md:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 border border-border shadow-medium hover:bg-background transition-colors z-10"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Próximo"
        className="hidden md:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 border border-border shadow-medium hover:bg-background transition-colors z-10"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>

      {/* Dots */}
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Ir para bangalô ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === selectedIndex
                  ? "w-6 bg-primary"
                  : "w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CarouselCard = ({ lodge }: { lodge: Lodge }) => {
  const { t } = useTranslation();
  const hasWifi = lodge.amenities?.includes("wifi");

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-shadow h-full flex flex-col border border-border/60">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted rounded-t-xl">
        {lodge.image ? (
          <img
            src={lodge.image}
            alt={lodge.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Coffee className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="truncate">{lodge.location}</span>
        </div>

        <h3 className="font-display font-bold text-lg lg:text-xl text-foreground mb-2">
          {lodge.name}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {lodge.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-accent" />
            <span>
              {lodge.guests} {t("common.people")}
            </span>
          </div>
          {hasWifi && <Wifi className="h-4 w-4 text-accent" />}
        </div>

        <Button
          asChild
          className="w-full bg-gradient-forest hover:opacity-90 min-h-[44px] font-semibold mt-auto"
        >
          <Link to={`/bangalos/${lodge.slug || lodge.id}`}>
            <Calendar className="mr-2 h-4 w-4" />
            {t("home.checkAvailability")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default BungalowCarousel;
