import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHeroSlides, type HeroSlide } from "@/hooks/useHeroSlides";
import heroBungalow1 from "@/assets/hero-bungalow-1.jpg";
import heroBungalow2 from "@/assets/hero-bungalow-2.jpg";

interface HeroCarouselProps {
  onSlideChange?: (hideOverlay: boolean) => void;
}

const FALLBACK_IMAGES = [
  { src: heroBungalow1, alt: "Pousada Arara Azul - Bangalô", objectFit: "cover" as const },
  { src: heroBungalow2, alt: "Pousada Arara Azul - Bangalô 2", objectFit: "cover" as const },
];

type UnifiedSlide =
  | { type: "fallback"; index: number }
  | { type: "db"; slide: HeroSlide };

const HeroCarousel = ({ onSlideChange }: HeroCarouselProps) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { slides: dbSlides, loading } = useHeroSlides();

  // Build unified list: fallback first, then DB slides
  const unifiedSlides: UnifiedSlide[] = [
    ...FALLBACK_IMAGES.map((_, i) => ({ type: "fallback" as const, index: i })),
    ...dbSlides.map((slide) => ({ type: "db" as const, slide })),
  ];

  const totalSlides = unifiedSlides.length;

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides, loading]);

  useEffect(() => {
    if (loading) return;
    const current = unifiedSlides[currentIndex];
    // Fallback slides show overlay (buttons), DB slides always hide it
    onSlideChange?.(current?.type === "db");
  }, [currentIndex, onSlideChange, loading, dbSlides]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const renderSlide = (unified: UnifiedSlide, idx: number) => {
    const isActive = idx === currentIndex;

    if (unified.type === "fallback") {
      const image = FALLBACK_IMAGES[unified.index];
      return (
        <div
          key={`fallback-${unified.index}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={image.src}
            alt={image.alt}
            width={1920}
            height={1080}
            loading={idx === 0 ? "eager" : "lazy"}
            decoding={idx === 0 ? "sync" : "async"}
            fetchPriority={idx === 0 ? "high" : "auto"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      );
    }

    const slide = unified.slide;
    const bgColor = slide.background_color || "hsl(120, 15%, 97%)";
    return (
      <div
        key={slide.id}
        className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundColor: bgColor }}
      >
        {slide.link_url ? (
          <a href={slide.link_url} className="absolute inset-0">
            {renderMedia(slide, idx)}
          </a>
        ) : (
          renderMedia(slide, idx)
        )}
        {/* Lateral gradients to blend image edges with background on desktop */}
        <div
          className="absolute inset-y-0 left-0 w-[15%] z-10 hidden lg:block pointer-events-none"
          style={{ background: `linear-gradient(to right, ${bgColor}, transparent)` }}
        />
        <div
          className="absolute inset-y-0 right-0 w-[15%] z-10 hidden lg:block pointer-events-none"
          style={{ background: `linear-gradient(to left, ${bgColor}, transparent)` }}
        />
        {!slide.hide_overlay && <div className="absolute inset-0 bg-black/20" />}
      </div>
    );
  };

  const renderMedia = (slide: HeroSlide, index: number) => {
    if (slide.media_type === "video") {
      return (
        <>
          {slide.mobile_image_url && (
            <video
              src={slide.mobile_image_url}
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover lg:hidden"
            />
          )}
          <video
            src={slide.desktop_image_url}
            autoPlay muted loop playsInline
            className={`absolute inset-0 w-full h-full ${slide.object_fit === "cover" ? "object-cover" : "object-contain"} ${slide.mobile_image_url ? "hidden lg:block" : ""}`}
          />
        </>
      );
    }

    if (slide.mobile_image_url) {
      return (
        <>
          <img
            src={slide.mobile_image_url}
            alt={slide.alt_text}
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
            fetchPriority={index === 0 ? "high" : "auto"}
            className={`absolute inset-0 w-full h-full ${slide.object_fit === "cover" ? "object-cover" : "object-contain"} lg:hidden`}
          />
          <img
            src={slide.desktop_image_url}
            alt={slide.alt_text}
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
            fetchPriority={index === 0 ? "high" : "auto"}
            className="absolute inset-0 w-full h-full object-contain hidden lg:block"
          />
        </>
      );
    }

    return (
      <>
        {/* Mobile: respect object_fit setting */}
        <img
          src={slide.desktop_image_url}
          alt={slide.alt_text}
          width={1920}
          height={1080}
          loading={index === 0 ? "eager" : "lazy"}
          decoding={index === 0 ? "sync" : "async"}
          fetchPriority={index === 0 ? "high" : "auto"}
          className={`absolute inset-0 w-full h-full ${slide.object_fit === "cover" ? "object-cover" : "object-contain"} lg:hidden`}
        />
        {/* Desktop: always object-contain to avoid cropping */}
        <img
          src={slide.desktop_image_url}
          alt={slide.alt_text}
          width={1920}
          height={1080}
          loading={index === 0 ? "eager" : "lazy"}
          decoding={index === 0 ? "sync" : "async"}
          fetchPriority={index === 0 ? "high" : "auto"}
          className="absolute inset-0 w-full h-full object-contain hidden lg:block"
        />
      </>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {unifiedSlides.map((s, i) => renderSlide(s, i))}

      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-2 sm:p-3 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={t("globals.prevImage")}
      >
        <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-2 sm:p-3 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={t("globals.nextImage")}
      >
        <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
      </button>

      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {unifiedSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 sm:w-2 sm:h-2 rounded-full transition-all min-w-[12px] min-h-[12px] ${
              index === currentIndex
                ? "bg-white w-8 sm:w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={t("globals.goToImage", { n: index + 1 })}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
