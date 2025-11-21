import { Link } from "react-router-dom";
import { Calendar, Users, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface PackageCardProps {
  id: string;
  name: string;
  duration: string;
  people: number;
  experiences: string[];
  inclusions: string[];
  total: string;
  highlight: string;
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
}: PackageCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden group hover:shadow-strong transition-all duration-300 flex flex-col h-full">
      <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border">
        <CardTitle className="text-3xl font-display font-bold text-foreground mb-2">
          {name}
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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

      <CardContent className="p-6 flex-1 flex flex-col">
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
          <div className="mb-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">
              A partir de 12x de
            </div>
            <div className="text-3xl font-bold text-primary">
              {(parseFloat(total.replace("R$ ", "").replace(".", "").replace(",", ".")) / 12).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ou {total} à vista
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
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageCard;
