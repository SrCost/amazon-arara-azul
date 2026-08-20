import { useTranslation } from "react-i18next";
import { Check, Clock, Sparkles } from "lucide-react";
import { useExperiences, localizedField, type Experience } from "@/hooks/useExperiences";
import { calculateExperiencePrice, formatBRL } from "@/lib/experiencePricing";
import { getExperienceIcon } from "@/components/experiences/experienceIcons";
import { Skeleton } from "@/components/ui/skeleton";

interface ExperiencesStepProps {
  totalGuests: number;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const ExperiencesStep = ({ totalGuests, selectedIds, onToggle }: ExperiencesStepProps) => {
  const { t, i18n } = useTranslation();
  const { experiences, loading } = useExperiences();

  const people = Math.max(1, totalGuests || 1);

  const experiencesTotal = experiences
    .filter((exp) => selectedIds.includes(exp.id))
    .reduce((sum, exp) => sum + calculateExperiencePrice(exp.base_price_per_person, people), 0);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-xl font-display font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          {t("experiencesModule.stepTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("experiencesModule.stepSubtitle", { count: people })}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((experience: Experience) => {
            const selected = selectedIds.includes(experience.id);
            const name = localizedField(experience, "name", i18n.language);
            const duration = localizedField(experience, "duration_label", i18n.language);
            const category = localizedField(experience, "category", i18n.language);
            const Icon = getExperienceIcon(localizedField(experience, "category", "pt"));
            const price = calculateExperiencePrice(experience.base_price_per_person, people);

            return (
              <button
                key={experience.id}
                type="button"
                onClick={() => onToggle(experience.id)}
                aria-pressed={selected}
                className={`w-full flex items-center gap-3 text-left rounded-xl border p-3 sm:p-4 transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-gradient-forest">
                  {experience.photos?.[0] ? (
                    <img
                      src={experience.photos[0]}
                      alt={name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-foreground/80" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-semibold text-foreground line-clamp-1">
                    {name}
                  </p>
                  {category && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{category}</p>
                  )}
                  {duration && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      {duration}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">{formatBRL(price)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("experiencesModule.forGuests", { count: people })}
                  </p>
                  <span
                    className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 p-4">
          <span className="text-sm text-foreground">
            {t("experiencesModule.stepTotal", { count: selectedIds.length })}
          </span>
          <span className="text-base font-semibold text-foreground">
            {formatBRL(experiencesTotal)}
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("experiencesModule.stepOptional")}</p>
    </div>
  );
};

export default ExperiencesStep;
