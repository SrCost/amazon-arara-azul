import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Experience } from "@/hooks/useExperiences";
import ExperienceOfferCard from "./ExperienceOfferCard";

interface ExperiencesCarouselProps {
  experiences: Experience[];
  onSelect: (experience: Experience) => void;
}

/**
 * Carrossel de scroll horizontal contínuo: uma única fileira de cards com
 * largura fixa, drag/swipe livre (scroll nativo) e setas que deslizam suavemente.
 * Sem paginação — não existe conceito de "página" nem espaço vazio.
 */
const ExperiencesCarousel = ({ experiences, onSelect }: ExperiencesCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, experiences.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {experiences.map((experience) => (
          <ExperienceOfferCard
            key={experience.id}
            experience={experience}
            onClick={() => onSelect(experience)}
          />
        ))}
      </div>

      {canScrollPrev && (
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => scrollBy(-1)}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollNext && (
        <button
          type="button"
          aria-label="Próximo"
          onClick={() => scrollBy(1)}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ExperiencesCarousel;
