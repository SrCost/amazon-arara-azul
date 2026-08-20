import { useTranslation } from "react-i18next";
import { Clock, Shirt, Backpack, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { localizedField, type Experience } from "@/hooks/useExperiences";
import { formatBRL } from "@/lib/experiencePricing";
import { getExperienceIcon } from "./experienceIcons";


interface ExperienceDetailModalProps {
  experience: Experience | null;
  open: boolean;
  onClose: () => void;
}

const ExperienceDetailModal = ({ experience, open, onClose }: ExperienceDetailModalProps) => {
  const { t, i18n } = useTranslation();
  if (!experience) return null;

  const lang = i18n.language;
  const name = localizedField(experience, "name", lang);
  const category = localizedField(experience, "category", lang);
  const full = localizedField(experience, "full_description", lang);
  const duration = localizedField(experience, "duration_label", lang);
  const wear = localizedField(experience, "what_to_wear", lang);
  const bring = localizedField(experience, "what_to_bring", lang);
  const notes = localizedField(experience, "operational_notes", lang);
  const photos = experience.photos ?? [];
  const Icon = getExperienceIcon(localizedField(experience, "category", "pt"));

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <div className="relative">
          {photos.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {photos.map((photo, i) => (
                  <CarouselItem key={i}>
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={photo}
                        alt={`${name} ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {photos.length > 1 && (
                <>
                  <CarouselPrevious className="left-3" />
                  <CarouselNext className="right-3" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="aspect-[16/10] bg-gradient-forest flex items-center justify-center">
              <Icon className="h-16 w-16 text-primary-foreground/80" />
            </div>
          )}
        </div>

        <div className="px-5 pb-6 sm:px-7 space-y-5">
          <DialogHeader className="space-y-2 text-left">
            {category && (
              <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Icon className="h-3.5 w-3.5" />
                {category}
              </span>
            )}
            <DialogTitle className="text-2xl font-display font-bold text-foreground">
              {name}
            </DialogTitle>
            {duration && (
              <DialogDescription className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {duration}
              </DialogDescription>
            )}
          </DialogHeader>

          {full && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{full}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {wear && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                  <Shirt className="h-4 w-4 text-primary" />
                  {t("experiencesModule.whatToWear")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{wear}</p>
              </div>
            )}
            {bring && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                  <Backpack className="h-4 w-4 text-primary" />
                  {t("experiencesModule.whatToBring")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{bring}</p>
              </div>
            )}
          </div>

          {notes && (
            <div className="flex gap-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{notes}</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">{t("experiencesModule.from")} </span>
              <span className="font-semibold">
                {formatBRL(experience.base_price_per_person)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                {t("experiencesModule.perPersonShort")}
              </span>
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExperienceDetailModal;
