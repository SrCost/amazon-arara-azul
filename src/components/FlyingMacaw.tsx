import { useLocation } from "react-router-dom";

/**
 * Ambient background element: a subtle macaw silhouette flying slowly
 * across the screen from right to left. Uses pure CSS transforms (GPU)
 * for performance and respects prefers-reduced-motion.
 * Hidden on admin routes.
 */
const FlyingMacaw = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 isolate overflow-hidden"
    >
      <div className="macaw-fly absolute top-[15vh] will-change-transform">
        <svg
          width="160"
          height="90"
          viewBox="0 0 160 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-[0.22] w-[110px] md:w-[160px] h-auto"
          style={{ filter: "drop-shadow(0 2px 4px hsl(145 63% 18% / 0.25))" }}
        >
          <defs>
            <linearGradient id="macawGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(145 63% 18%)" />
              <stop offset="100%" stopColor="hsl(200 80% 35%)" />
            </linearGradient>
          </defs>

          {/* Long tail feathers */}
          <path
            d="M2 48 L28 44 L20 47 L34 46 L24 50 L36 50 L26 53 L32 56 Z"
            fill="url(#macawGrad)"
          />

          {/* Body */}
          <ellipse cx="62" cy="46" rx="28" ry="9" fill="url(#macawGrad)" />

          {/* Head + beak */}
          <circle cx="92" cy="42" r="10" fill="url(#macawGrad)" />
          <path d="M100 41 L112 44 L100 46 Z" fill="url(#macawGrad)" />

          {/* Wings (flapping) */}
          <g className="macaw-wings" style={{ transformOrigin: "62px 46px" }}>
            {/* Upper wing */}
            <path
              d="M40 44 Q55 18 80 28 Q70 36 60 40 Z"
              fill="url(#macawGrad)"
            />
            {/* Lower wing */}
            <path
              d="M44 50 Q60 72 84 64 Q72 56 60 52 Z"
              fill="url(#macawGrad)"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default FlyingMacaw;
