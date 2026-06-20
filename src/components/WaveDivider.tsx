interface WaveDividerProps {
  flip?: boolean;
  className?: string;
}

const WaveDivider = ({ flip = false, className = "" }: WaveDividerProps) => {
  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden leading-[0] pointer-events-none ${className}`}
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full h-12 sm:h-16 md:h-20"
      >
        <path
          d="M0,40 C240,80 480,0 720,32 C960,64 1200,16 1440,48 L1440,80 L0,80 Z"
          fill="#2d6a4f"
          fillOpacity="0.35"
        />
        <path
          d="M0,56 C240,32 480,72 720,52 C960,32 1200,72 1440,48 L1440,80 L0,80 Z"
          fill="#2d6a4f"
          fillOpacity="0.18"
        />
      </svg>
    </div>
  );
};

export default WaveDivider;
