import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { localizedField, type Experience } from "@/hooks/useExperiences";
import { getExperienceIcon } from "./experienceIcons";

interface ExperienceOfferCardProps {
  experience: Experience;
  onClick: () => void;
}

/** Card de largura fixa para o carrossel de scroll horizontal contínuo. */
const ExperienceOfferCard = ({ experience, onClick }: ExperienceOfferCardProps) => {
  const { i18n } = useTranslation();

  const name = localizedField(experience, "name", i18n.language);
  const category = localizedField(experience, "category", i18n.language);
  const duration = localizedField(experience, "duration_label", i18n.language);
  const cover = experience.photos?.[0];
  const Icon = getExperienceIcon(localizedField(experience, "category", "pt"));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      className="group text-left rounded-xl overflow-hidden bg-card border border-border shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 shrink-0 snap-start w-[210px] sm:w-[240px] lg:w-[260px]"
    >
      <div className="relative overflow-hidden bg-gradient-forest aspect-[4/3]">
        {cover ? (
          <img
            src={cover}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-10 w-10 text-primary-foreground/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {category && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-card/90 text-primary border border-primary/25 backdrop-blur-sm">
            <Icon className="h-3 w-3" />
            {category}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col">
        <h3
          title={name}
          className="text-sm sm:text-base font-display font-semibold text-foreground line-clamp-2 h-[2.6em] leading-[1.3]"
        >
          {name}
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground h-5 mt-1">
          {duration && (
            <>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{duration}</span>
            </>
          )}
        </p>
      </div>
    </button>
  );
};

export default ExperienceOfferCard;
