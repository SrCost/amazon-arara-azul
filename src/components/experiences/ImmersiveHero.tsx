import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface HeroImage {
  src: string;
  alt: string;
}

interface ImmersiveHeroProps {
  images: HeroImage[];
  onSlideClick?: (index: number) => void;
}

const SLIDE_BG = [
  "linear-gradient(135deg, #0a1f17 0%, #0F6E56 100%)",
  "linear-gradient(135deg, #2a1a08 0%, #8a5a1a 100%)",
  "linear-gradient(135deg, #062633 0%, #1a6b8a 100%)",
  "linear-gradient(135deg, #0f2a1f 0%, #2d6a4f 100%)",
];

const CATEGORIES = ["Cultura", "Fauna", "Natureza", "Aventura"];
const AUTOPLAY_MS = 5500;
const RESUME_MS = 8000;

const ImmersiveHero = ({ images, onSlideClick }: ImmersiveHeroProps) => {
  const { t } = useTranslation();
  const slides = images.slice(0, 4);
  const [active, setActive] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const interactRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const isTouch = useRef(false);

  const next = useCallback(
    () => setActive((i) => (slides.length ? (i + 1) % slides.length : 0)),
    [slides.length]
  );
  const goTo = (i: number) => setActive(i);

  // Autoplay
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      if (!pausedRef.current) next();
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [next, slides.length]);

  const pauseAutoplay = () => {
    pausedRef.current = true;
    if (interactRef.current) window.clearTimeout(interactRef.current);
    interactRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_MS);
  };

  // Mouse parallax + tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTouch.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -6, y: x * 8, px: x * 14, py: y * 14 });
    setCursor({ x: e.clientX, y: e.clientY, visible: true });
  };
  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, px: 0, py: 0 });
    setCursor((c) => ({ ...c, visible: false }));
  };

  // Drag / swipe
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") isTouch.current = true;
    dragStartX.current = e.clientX;
    pauseAutoplay();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else setActive((i) => (i - 1 + slides.length) % slides.length);
    }
  };

  if (!slides.length) {
    return (
      <div className="w-full h-[320px] sm:h-[400px] rounded-2xl bg-muted animate-pulse" />
    );
  }

  return (
    <>
      {/* Custom cursor */}
      <div
        aria-hidden
        className="fixed pointer-events-none z-50 hidden md:block transition-opacity duration-200"
        style={{
          left: cursor.x - 16,
          top: cursor.y - 16,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid white",
          mixBlendMode: "difference",
          opacity: cursor.visible ? 1 : 0,
          transform: "translate3d(0,0,0)",
        }}
      />

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={pauseAutoplay}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="relative w-full select-none md:cursor-none"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden shadow-strong transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
          onClick={() => onSlideClick?.(active)}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 ease-out"
              style={{
                opacity: i === active ? 1 : 0,
                background: SLIDE_BG[i % SLIDE_BG.length],
                pointerEvents: i === active ? "auto" : "none",
              }}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out"
                style={{
                  transform: `translate3d(${tilt.py}px, ${tilt.px}px, 0) scale(1.08)`,
                  opacity: 0.92,
                }}
              />
              {/* Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              {/* Overlay content */}
              <div
                key={`overlay-${active}-${i}`}
                className={`absolute left-5 sm:left-8 right-5 sm:right-8 bottom-6 sm:bottom-10 ${
                  i === active ? "animate-fade-in-up" : ""
                }`}
              >
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 backdrop-blur-sm border border-white/10"
                  style={{
                    background: "rgba(45,106,79,0.35)",
                    color: "#e8fff5",
                  }}
                >
                  {CATEGORIES[i % CATEGORIES.length]}
                </span>
                <h3 className="text-2xl sm:text-4xl font-display font-bold text-white drop-shadow-lg leading-tight">
                  {slide.alt || t("experiences.title")}
                </h3>
                <p className="hidden sm:block text-sm sm:text-base text-white/85 mt-2 max-w-xl drop-shadow">
                  {t("experiences.subtitle").slice(0, 100)}…
                </p>
              </div>
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                  pauseAutoplay();
                }}
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: i === active ? 32 : 8,
                  background: i === active ? "#ffffff" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Thumbnails strip */}
        <div className="mt-4 flex gap-2 sm:gap-3 justify-center">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                goTo(i);
                pauseAutoplay();
              }}
              className="relative overflow-hidden rounded-md transition-all duration-300"
              style={{
                width: 72,
                height: 44,
                border:
                  i === active ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                transform: i === active ? "scale(1.06)" : "scale(1)",
                opacity: i === active ? 1 : 0.7,
              }}
              aria-label={`Thumbnail ${i + 1}`}
            >
              <img
                src={s.src}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ImmersiveHero;
