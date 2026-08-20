import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";
import type { Experience } from "@/hooks/useExperiences";
import ExperienceOfferCard from "./ExperienceOfferCard";

interface ExperienceCategoryRowProps {
  category: string;
  experiences: Experience[];
  index: number;
  onSelect: (experience: Experience) => void;
}

const ExperienceCategoryRow = ({
  category,
  experiences,
  index,
  onSelect,
}: ExperienceCategoryRowProps) => {
  const { ref, inView } = useInViewAnimation<HTMLDivElement>();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, experiences.length]);

  const scrollBy = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
  };

  return (
    <div
      ref={ref}
      style={{
        animationDelay: inView ? `${(index % 5) * 120}ms` : undefined,
        opacity: inView ? undefined : 0,
      }}
      className={`group/row space-y-3 ${inView ? "animate-fade-in-up" : ""}`}
    >
      <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground">{category}</h3>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4 pb-2 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {experiences.map((experience) => (
            <ExperienceOfferCard
              key={experience.id}
              experience={experience}
              onClick={() => onSelect(experience)}
            />
          ))}
        </div>

        {canPrev && (
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollBy(-1)}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 h-9 w-9 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity motion-reduce:transition-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canNext && (
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scrollBy(1)}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 h-9 w-9 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity motion-reduce:transition-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExperienceCategoryRow;
