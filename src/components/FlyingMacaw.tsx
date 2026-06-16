/**
 * Ambient background element: a subtle macaw silhouette flying slowly
 * across the screen from right to left. Uses pure CSS transforms (GPU)
 * for performance and respects prefers-reduced-motion.
 */
const FlyingMacaw = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="macaw-fly absolute top-[20vh] will-change-transform">
        <svg
          width="120"
          height="60"
          viewBox="0 0 120 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-[0.13] w-[80px] md:w-[120px] h-auto"
        >
          <defs>
            <linearGradient id="macawGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(145 63% 28%)" />
              <stop offset="100%" stopColor="hsl(200 75% 45%)" />
            </linearGradient>
          </defs>
          {/* Stylized macaw silhouette in flight */}
          <path
            d="M5 30 Q20 10 40 22 L55 18 Q70 8 85 18 Q95 12 110 20 Q100 28 90 26 L75 32 Q70 38 60 36 L45 40 Q30 44 18 38 Q10 36 5 30 Z"
            fill="url(#macawGrad)"
          />
          {/* Long tail */}
          <path
            d="M5 30 L0 34 L4 32 L0 36 L6 34 Z"
            fill="url(#macawGrad)"
          />
        </svg>
      </div>
    </div>
  );
};

export default FlyingMacaw;
