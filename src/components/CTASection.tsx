import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/config/socialLinks";

interface CTASectionProps {
  variant?: "primary" | "secondary" | "whatsapp";
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  className?: string;
}

const CTASection = ({
  variant = "primary",
  title,
  description,
  buttonText,
  buttonLink = "/bangalos",
  className = "",
}: CTASectionProps) => {
  const { t } = useTranslation();
  const whatsappMessage = encodeURIComponent(t("support.whatsappMessage"));
  const defaultButtonText = buttonText || t("nav.bookNow");

  if (variant === "whatsapp") {
    return (
      <div className={`text-center py-8 sm:py-12 ${className}`}>
        <p className="text-muted-foreground mb-4">
          {description || t("home.preferDirectContact")}
        </p>
        <a
          href={`${SOCIAL_LINKS.whatsapp}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="lg"
            className="bg-[#25D366] hover:bg-[#20BD5A] text-white min-h-[48px] px-6 sm:px-8"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            {t("support.talkOnWhatsApp")}
          </Button>
        </a>
      </div>
    );
  }

  if (variant === "secondary") {
    return (
      <div className={`text-center py-6 sm:py-8 ${className}`}>
        <Button
          size="lg"
          variant="outline"
          className="min-h-[48px] px-6 sm:px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          asChild
        >
          <Link to={buttonLink}>
            {defaultButtonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className={`py-10 sm:py-14 bg-gradient-to-r from-primary to-secondary ${className}`}>
      <div className="container mx-auto px-4 text-center">
        {title && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-3 sm:mb-4">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            {description}
          </p>
        )}
        <Button
          size="lg"
          className="bg-white text-primary hover:bg-white/90 min-h-[52px] px-8 sm:px-10 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all animate-pulse"
          asChild
        >
          <Link to={buttonLink}>
            {defaultButtonText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default CTASection;