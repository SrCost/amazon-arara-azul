import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Facebook, Instagram, Mail, Phone, Shield, LogIn, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/config/socialLinks";

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
                <Link to="/pousadas" className="opacity-90 hover:opacity-100 transition-opacity">
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
