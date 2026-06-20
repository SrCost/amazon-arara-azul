import type { LucideIcon } from "lucide-react";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";

interface ExperienceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  category: string;
  image?: { src: string; alt: string };
  index: number;
  onClick?: () => void;
}

const ExperienceCard = ({
  icon: Icon,
  title,
  description,
  category,
  image,
  index,
  onClick,
}: ExperienceCardProps) => {
  const { ref, inView } = useInViewAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        animationDelay: inView ? `${(index % 6) * 90}ms` : undefined,
        opacity: inView ? undefined : 0,
      }}
      className={`group relative rounded-2xl overflow-hidden bg-card border border-border shadow-medium hover:shadow-strong cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
        inView ? "animate-fade-in-up" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-forest">
        {image ? (
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-16 w-16 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
          style={{
            background: "rgba(45,106,79,0.12)",
            color: "#0F6E56",
            border: "1px solid rgba(45,106,79,0.25)",
          }}
        >
          <Icon className="h-3.5 w-3.5" />
          {category}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
};

export default ExperienceCard;
