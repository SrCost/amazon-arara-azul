import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Facebook, Instagram, Mail, Phone, Shield, LogIn, MessageCircle, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/config/socialLinks";

// Airbnb icon component
const AirbnbIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.413-4.457-.265-1.143-.053-2.063.477-2.649.371-.424.848-.636 1.432-.636.583 0 1.06.212 1.432.636.53.586.742 1.506.477 2.649-.265 1.273-1.06 2.76-2.413 4.457h.008zm6.614 1.326c-.159.689-.689 1.273-1.379 1.485-.159.053-.318.053-.477.053-.477 0-.954-.159-1.379-.53-.265-.212-.53-.477-.795-.795.901-1.114 1.644-2.175 2.175-3.184.742-1.379 1.114-2.649 1.114-3.816 0-1.485-.477-2.702-1.379-3.604-1.008-1.008-2.387-1.538-4.004-1.538s-2.996.53-4.004 1.538c-.901.901-1.379 2.119-1.379 3.604 0 1.167.371 2.438 1.114 3.816.53 1.008 1.273 2.069 2.175 3.184-.265.318-.53.583-.795.795-.424.371-.901.53-1.379.53-.159 0-.318 0-.477-.053-.689-.212-1.22-.795-1.379-1.485-.106-.424-.053-.901.159-1.432.159-.371.371-.742.636-1.114-.265-.318-.53-.689-.742-1.008-.212-.318-.424-.636-.583-.954-.424.636-.795 1.326-.954 2.016-.318 1.061-.212 2.122.318 3.024.477.848 1.273 1.485 2.228 1.75.318.106.689.159 1.008.159.689 0 1.326-.212 1.91-.583.424-.265.795-.583 1.167-.954.371.371.742.689 1.167.954.583.371 1.22.583 1.91.583.318 0 .689-.053 1.008-.159.954-.265 1.75-.901 2.228-1.75.53-.901.636-1.963.318-3.024-.159-.689-.53-1.379-.954-2.016-.159.318-.371.636-.583.954-.212.318-.477.689-.742 1.008.265.371.477.742.636 1.114.212.53.265 1.008.159 1.432z"/>
  </svg>
);

const Footer = () => {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-display font-bold mb-4">Pousada Arara Azul</h3>
            <p className="text-sm opacity-90">
              {t("home.heroSubtitle")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("nav.home")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/bangalos" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("nav.lodges")}
                </Link>
              </li>
              <li>
                <Link to="/sustentabilidade" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("nav.sustainability")}
                </Link>
              </li>
              <li>
                <Link to="/como-chegar" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("nav.howToGetThere")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer.about")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contato" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("footer.privacyPolicy")}
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("footer.termsOfUse")}
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  {t("footer.cancellationPolicy")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer.contact")}</h4>
            <div className="space-y-3 text-sm">
              <a 
                href={SOCIAL_LINKS.whatsapp}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 opacity-90 hover:opacity-100 transition-opacity"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{SOCIAL_LINKS.whatsappNumber}</span>
              </a>
              <div className="flex items-center space-x-2 opacity-90">
                <Phone className="h-4 w-4" />
                <span>{SOCIAL_LINKS.phone}</span>
              </div>
              <div className="flex items-center space-x-2 opacity-90">
                <Mail className="h-4 w-4" />
                <span>{SOCIAL_LINKS.email}</span>
              </div>
              <div className="flex space-x-4 mt-4">
                <a 
                  href={SOCIAL_LINKS.instagram}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-90 hover:opacity-100 transition-opacity"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href={SOCIAL_LINKS.facebook}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-90 hover:opacity-100 transition-opacity"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href={SOCIAL_LINKS.airbnb}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-90 hover:opacity-100 transition-opacity"
                  aria-label="Airbnb"
                >
                  <AirbnbIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-80">&copy; 2025 Pousada Arara Azul. {t("footer.allRightsReserved")}</p>
          
          {/* Admin Login Button - Discreto no rodapé */}
          {(isAdmin || isSuperAdmin) ? (
            <Link to="/admin">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary-foreground/70 hover:text-primary-foreground/100 text-xs"
              >
                <Shield className="h-3 w-3 mr-1" />
                Painel Admin
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary-foreground/50 hover:text-primary-foreground/80 text-xs"
              >
                <LogIn className="h-3 w-3 mr-1" />
                Acesso Administrativo
              </Button>
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
