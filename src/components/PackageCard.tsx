import { Link } from "react-router-dom";
import { Calendar, Users, CheckCircle, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { SOCIAL_LINKS } from "@/config/socialLinks";

interface PackageCardProps {
  id: string;
  name: string;
  duration: string;
  people: number;
  experiences: string[];
  inclusions: string[];
  total: string;
  highlight: string;
  isCustomizable?: boolean;
}

const PackageCard = ({
  id,
  name,
  duration,
  people,
  experiences,
  inclusions,
  total,
  highlight,
  isCustomizable = false,
}: PackageCardProps) => {
  const { t } = useTranslation();

  const isCustom = isCustomizable || total === "Sob Consulta" || id === "gaviao-panema";

  return (
    <Card className={`overflow-hidden group hover:shadow-strong transition-all duration-300 flex flex-col h-full ${isCustom ? "border-amber-200 bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/20" : ""}`}>
      <CardHeader className={`p-4 sm:p-6 border-b border-border ${isCustom ? "bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/30 dark:to-orange-900/30" : "bg-gradient-to-br from-primary/10 to-accent/10"}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <CardTitle className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {name}
          </CardTitle>
          {isCustom && (
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-semibold self-start">
              {t("packages.customized")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-accent" />
            {duration}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-accent" />
            {people} {t("packages.people")}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Inclusions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-accent" />
            {t("packages.inclusions")}
          </h3>
          <ul className="space-y-2">
            {inclusions.map((inclusion, index) => (
              <li
                key={index}
                className="text-sm text-muted-foreground flex items-start"
              >
                <span className="text-accent mr-2 mt-0.5">•</span>
                {inclusion}
              </li>
            ))}
          </ul>
        </div>

        {/* Experiences */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-accent" />
            {t("packages.experiences")}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {experiences.map((experience, index) => (
              <div
                key={index}
                className="text-sm text-muted-foreground flex items-start"
              >
                <span className="text-accent mr-2 mt-0.5">✓</span>
                {experience}
              </div>
            ))}
          </div>
        </div>

        {/* Highlight */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            {highlight}
          </p>
        </div>

        {/* Price and CTA */}
        <div className="mt-auto">
          {isCustom ? (
            <>
              <div className="mb-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                  {t("packages.onRequest")}
                </div>
                <div className="text-sm text-amber-600 mt-1">
                  {t("packages.talkToConsultant")}
                </div>
              </div>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <a 
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("packages.consult")}
                </a>
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("packages.from12x")}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {(parseFloat(total.replace("R$ ", "").replace(".", "").replace(",", ".")) / 12).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("packages.orCash", { total })}
                </div>
              </div>
              <Button
                asChild
                className="w-full bg-gradient-forest hover:opacity-90 transition-opacity"
              >
                <Link to={`/bangalos?pacote=${id}`}>
                  {t("packages.bookButton")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageCard;