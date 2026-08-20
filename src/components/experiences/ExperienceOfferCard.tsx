import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";
import { localizedField, type Experience } from "@/hooks/useExperiences";
import { formatBRL } from "@/lib/experiencePricing";
import { getExperienceIcon } from "./experienceIcons";

interface ExperienceOfferCardProps {
  experience: Experience;
  index: number;
  onClick: () => void;
}

const ExperienceOfferCard = ({ experience, index, onClick }: ExperienceOfferCardProps) => {
  const { t, i18n } = useTranslation();
  const { ref, inView } = useInViewAnimation<HTMLButtonElement>();

  const name = localizedField(experience, "name", i18n.language);
  const category = localizedField(experience, "category", i18n.language);
  const short = localizedField(experience, "short_description", i18n.language);
  const duration = localizedField(experience, "duration_label", i18n.language);
  const cover = experience.photos?.[0];
  const Icon = getExperienceIcon(localizedField(experience, "category", "pt"));

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={name}
      style={{
        animationDelay: inView ? `${(index % 6) * 90}ms` : undefined,
        opacity: inView ? undefined : 0,
      }}
      className={`group text-left rounded-2xl overflow-hidden bg-card border border-border shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        inView ? "animate-fade-in-up" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-forest">
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
            <Icon className="h-14 w-14 text-primary-foreground/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {category && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-card/90 text-primary border border-primary/25 backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" />
            {category}
          </span>
        )}
      </div>

      <div className="p-5 space-y-2">
        <h3 className="text-lg font-display font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{short}</p>
        {duration && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <Clock className="h-3.5 w-3.5" />
            {duration}
          </p>
        )}
        <p className="text-sm text-foreground pt-1">
          <span className="text-muted-foreground">{t("experiencesModule.from")} </span>
          <span className="font-semibold">{formatBRL(experience.base_price_per_person)}</span>
          <span className="text-muted-foreground"> {t("experiencesModule.perPersonShort")}</span>
        </p>
      </div>
    </button>
  );
};

export default ExperienceOfferCard;
