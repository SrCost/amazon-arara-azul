import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Experience } from "@/hooks/useExperiences";
import ExperienceOfferCard from "./ExperienceOfferCard";

interface ExperiencesCarouselProps {
  experiences: Experience[];
  onSelect: (experience: Experience) => void;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Carrossel único com duas linhas de cards, autoplay e loop infinito. */
const ExperiencesCarousel = ({ experiences, onSelect }: ExperiencesCarouselProps) => {
  const reduceMotion = useMemo(prefersReducedMotion, []);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", containScroll: "trimSnaps", dragFree: false },
    reduceMotion
      ? []
      : [Autoplay({ delay: 4000, stopOnMouseEnter: true, stopOnInteraction: false, stopOnFocusIn: true })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  // Divide em colunas de 2 (linha 1 = índices pares, linha 2 = ímpares)
  const columns = useMemo(() => {
    const pairs: Experience[][] = [];
    for (let i = 0; i < experiences.length; i += 2) {
      pairs.push(experiences.slice(i, i + 2));
    }
    return pairs;
  }, [experiences]);

  const onSelectSnap = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnapCount(emblaApi.scrollSnapList().length);
    onSelectSnap();
    emblaApi.on("select", onSelectSnap);
    emblaApi.on("reInit", () => {
      setSnapCount(emblaApi.scrollSnapList().length);
      onSelectSnap();
    });
  }, [emblaApi, onSelectSnap]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3 sm:-ml-4">
          {columns.map((pair, index) => (
            <div
              key={pair[0]?.id ?? index}
              className="pl-3 sm:pl-4 shrink-0 grow-0 basis-[78%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <div className="flex flex-col gap-3 sm:gap-4 h-full">
                {pair.map((experience) => (
                  <div key={experience.id} className={pair.length === 1 ? "flex-1 min-h-0" : ""}>
                    <ExperienceOfferCard
                      experience={experience}
                      variant="fill"
                      fillHeight={pair.length === 1}
                      onClick={() => onSelect(experience)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Anterior"
        onClick={() => emblaApi?.scrollPrev()}
        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Próximo"
        onClick={() => emblaApi?.scrollNext()}
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground hover:bg-accent transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {snapCount > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o grupo ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === selectedIndex ? "w-6 bg-primary" : "w-2 bg-border hover:bg-primary/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperiencesCarousel;
