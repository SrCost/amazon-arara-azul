import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Experience } from "@/hooks/useExperiences";
import ExperienceOfferCard from "./ExperienceOfferCard";

interface ExperiencesCarouselProps {
  experiences: Experience[];
  onSelect: (experience: Experience) => void;
}

/**
 * Carrossel de scroll horizontal contínuo com loop infinito nos dois sentidos.
 * A lista é renderizada 3x (clone anterior / original / clone seguinte) e o
 * scrollLeft é reposicionado silenciosamente quando sai do bloco central.
 */
const ExperiencesCarousel = ({ experiences, onSelect }: ExperiencesCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const blockWidthRef = useRef(0);
  const readyRef = useRef(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // 3 blocos idênticos: largura de um bloco = scrollWidth / 3
    blockWidthRef.current = el.scrollWidth / 3;
  }, []);

  const recenter = useCallback(() => {
    const el = trackRef.current;
    const block = blockWidthRef.current;
    if (!el || block <= 0) return;
    el.scrollLeft = block;
    readyRef.current = true;
  }, []);

  useLayoutEffect(() => {
    if (experiences.length === 0) return;
    readyRef.current = false;
    const id = requestAnimationFrame(() => {
      measure();
      recenter();
    });
    return () => cancelAnimationFrame(id);
  }, [experiences, measure, recenter]);

  // Mantém o scroll dentro do bloco central (loop imperceptível).
  const normalize = useCallback(() => {
    const el = trackRef.current;
    const block = blockWidthRef.current;
    if (!el || block <= 0 || !readyRef.current) return;
    if (el.scrollLeft < block * 0.5) {
      el.scrollLeft += block;
    } else if (el.scrollLeft > block * 1.5) {
      el.scrollLeft -= block;
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => normalize();
    const onResize = () => {
      measure();
      recenter();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [normalize, measure, recenter, experiences.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Drag com mouse no desktop; suprime o clique apenas se houve arraste real.
  const dragState = useRef({ startX: 0, startScroll: 0, dragging: false, moved: false });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    dragState.current = { startX: e.clientX, startScroll: el.scrollLeft, dragging: true, moved: false };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    const state = dragState.current;
    if (!el || !state.dragging) return;
    const delta = e.clientX - state.startX;
    if (Math.abs(delta) > 6) state.moved = true;
    if (state.moved) {
      e.preventDefault();
      el.scrollLeft = state.startScroll - delta;
      normalize();
      // o ponto de partida acompanha o reposicionamento do loop
      state.startScroll = el.scrollLeft + delta;
    }
  };

  const endDrag = () => {
    dragState.current.dragging = false;
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  if (experiences.length === 0) return null;

  const blocks = [0, 1, 2];

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {blocks.map((block) => (
          <div
            key={block}
            className="flex gap-3 sm:gap-4 shrink-0"
            aria-hidden={block !== 1 ? true : undefined}
          >
            {experiences.map((experience) => (
              <ExperienceOfferCard
                key={`${block}-${experience.id}`}
                experience={experience}
                onClick={() => onSelect(experience)}
              />
            ))}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollBy(-1)}
        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Próximo"
        onClick={() => scrollBy(1)}
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-medium text-foreground hover:bg-accent transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ExperiencesCarousel;
