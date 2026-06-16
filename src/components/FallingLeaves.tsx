import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Ambient background: a few Amazonian leaves slowly falling across the page.
 * - GPU-only animation (transform), no filters/shadows.
 * - 2 leaves on mobile, 4 on desktop.
 * - Pauses when the tab is hidden. Disabled under prefers-reduced-motion.
 * - Hidden on /admin routes.
 */
const LEAVES_DESKTOP = [
  { left: "4%",  size: 28, dur: 26, delay: -2,  sway: 60,  shape: "a", color: "text-primary" },
  { left: "11%", size: 20, dur: 30, delay: -18, sway: -40, shape: "b", color: "text-secondary" },
  { left: "19%", size: 26, dur: 24, delay: -6,  sway: 55,  shape: "a", color: "text-secondary" },
  { left: "27%", size: 22, dur: 32, delay: -14, sway: -50, shape: "b", color: "text-primary" },
  { left: "35%", size: 30, dur: 28, delay: -10, sway: 70,  shape: "a", color: "text-primary" },
  { left: "43%", size: 18, dur: 22, delay: -4,  sway: -35, shape: "b", color: "text-secondary" },
  { left: "51%", size: 24, dur: 30, delay: -22, sway: 50,  shape: "a", color: "text-secondary" },
  { left: "59%", size: 28, dur: 26, delay: -12, sway: -60, shape: "b", color: "text-primary" },
  { left: "67%", size: 20, dur: 34, delay: -8,  sway: 45,  shape: "a", color: "text-primary" },
  { left: "74%", size: 26, dur: 24, delay: -16, sway: -55, shape: "b", color: "text-secondary" },
  { left: "81%", size: 22, dur: 28, delay: -3,  sway: 40,  shape: "a", color: "text-secondary" },
  { left: "87%", size: 30, dur: 32, delay: -20, sway: -70, shape: "b", color: "text-primary" },
  { left: "93%", size: 18, dur: 26, delay: -11, sway: 35,  shape: "a", color: "text-primary" },
  { left: "97%", size: 24, dur: 30, delay: -5,  sway: -50, shape: "b", color: "text-secondary" },
];

const LEAVES_MOBILE = [
  { left: "8%",  size: 18, dur: 28, delay: -3,  sway: 35,  shape: "a", color: "text-primary" },
  { left: "22%", size: 14, dur: 32, delay: -15, sway: -28, shape: "b", color: "text-secondary" },
  { left: "36%", size: 20, dur: 26, delay: -8,  sway: 30,  shape: "a", color: "text-secondary" },
  { left: "50%", size: 16, dur: 30, delay: -20, sway: -32, shape: "b", color: "text-primary" },
  { left: "64%", size: 18, dur: 24, delay: -5,  sway: 38,  shape: "a", color: "text-primary" },
  { left: "78%", size: 14, dur: 32, delay: -12, sway: -25, shape: "b", color: "text-secondary" },
  { left: "92%", size: 20, dur: 28, delay: -18, sway: 33,  shape: "a", color: "text-secondary" },
];

const FallingLeaves = () => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const leaves = isMobile ? LEAVES_MOBILE : LEAVES_DESKTOP;
  const baseOpacity = isMobile ? 0.12 : 0.18;

  return (
    <div
      aria-hidden="true"
      className={`leaves-layer pointer-events-none fixed inset-0 z-0 overflow-hidden ${paused ? "leaves-paused" : ""}`}
    >
      {/* Single SVG sprite with reusable shapes */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {/* Lanceolate leaf */}
          <symbol id="leaf-a" viewBox="0 0 24 24">
            <path
              d="M12 1 C18 6 21 12 12 23 C3 12 6 6 12 1 Z M12 4 L12 21"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </symbol>
          {/* Oval leaf */}
          <symbol id="leaf-b" viewBox="0 0 24 24">
            <path
              d="M12 2 C19 4 22 12 12 22 C2 12 5 4 12 2 Z"
              fill="currentColor"
            />
          </symbol>
        </defs>
      </svg>

      {leaves.map((l, i) => (
        <svg
          key={i}
          className={`leaf absolute top-0 ${l.color}`}
          width={l.size}
          height={l.size}
          style={{
            left: l.left,
            opacity: baseOpacity,
            ["--sway" as string]: `${l.sway}px`,
            ["--dur" as string]: `${l.dur}s`,
            ["--delay" as string]: `${l.delay}s`,
          }}
        >
          <use href={`#leaf-${l.shape}`} />
        </svg>
      ))}
    </div>
  );
};

export default FallingLeaves;
