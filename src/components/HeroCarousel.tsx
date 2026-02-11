import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroBungalow1 from "@/assets/hero-bungalow-1.jpg";
import heroBungalow2 from "@/assets/hero-bungalow-2.jpg";
import pascoaBanner from "@/assets/pascoa-pacote-banner.png";

interface CarouselImage {
  src: string;
  alt: string;
  objectFit: "cover" | "contain";
  backgroundColor?: string;
  hideOverlay?: boolean;
}

interface HeroCarouselProps {
  onSlideChange?: (hideOverlay: boolean) => void;
}

const CAROUSEL_IMAGES: CarouselImage[] = [
  { src: heroBungalow1, alt: "Pousada Arara Azul - Bangalô", objectFit: "cover" },
  { src: heroBungalow2, alt: "Pousada Arara Azul - Bangalô 2", objectFit: "cover" },
  { src: pascoaBanner, alt: "Pacote Páscoa - Pousada Arara Azul", objectFit: "contain", backgroundColor: "rgb(30, 58, 140)", hideOverlay: true },
];

const HeroCarousel = ({ onSlideChange }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    onSlideChange?.(CAROUSEL_IMAGES[currentIndex].hideOverlay ?? false);
  }, [currentIndex, onSlideChange]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {CAROUSEL_IMAGES.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundColor: image.backgroundColor || "transparent" }}
        >
          {image.objectFit === "contain" && (
            <img
              src={image.src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-80 sm:hidden"
            />
          )}
          <img
            src={image.src}
            alt={image.alt}
            width={1920}
            height={1080}
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
            fetchPriority={index === 0 ? "high" : "auto"}
            className={`absolute inset-0 w-full h-full ${
              image.objectFit === "cover" ? "object-cover" : "object-contain"
            }`}
          />
          {!image.hideOverlay && <div className="absolute inset-0 bg-black/20" />}
        </div>
      ))}

      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-2 sm:p-3 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Imagem anterior"
      >
        <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-2 sm:p-3 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Próxima imagem"
      >
        <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
      </button>

      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 sm:w-2 sm:h-2 rounded-full transition-all min-w-[12px] min-h-[12px] ${
              index === currentIndex
                ? "bg-white w-8 sm:w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Ir para imagem ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
