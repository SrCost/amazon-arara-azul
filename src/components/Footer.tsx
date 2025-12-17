import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Facebook, Instagram, Mail, Shield, LogIn, MessageCircle, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/config/socialLinks";

const Footer = () => {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();
  
  const whatsappMessage = encodeURIComponent("Olá, gostaria de consultar disponibilidade na Pousada Arara Azul.");

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-secondary to-accent py-8 sm:py-10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-3">
            Pronto para viver a Amazônia?
          </h3>
          <p className="text-white/90 mb-5 max-w-lg mx-auto text-sm sm:text-base">
            Reserve agora e garanta sua experiência única na floresta amazônica
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 min-h-[52px] px-8 font-semibold shadow-lg"
              asChild
            >
              <Link to="/bangalos">
                Reservar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <a
              href={`${SOCIAL_LINKS.whatsapp}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10 min-h-[52px] px-8 w-full sm:w-auto"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-display font-bold mb-4">Pousada Arara Azul</h3>
            <p className="text-sm opacity-90 mb-4">
              {t("home.heroSubtitle")}
            </p>
            <div className="flex items-start gap-2 text-sm opacity-90">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Manacapuru, Amazonas, Brasil</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">{t("nav.home")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/bangalos" className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center">
                  {t("nav.lodges")}
                </Link>
              </li>
              <li>
                <Link to="/pacotes" className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center">
                  Pacotes
                </Link>
              </li>
              <li>
                <Link to="/sustentabilidade" className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center">
                  {t("nav.sustainability")}
                </Link>
              </li>
              <li>
                <Link to="/como-chegar" className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center">
                  {t("nav.howToGetThere")}
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.about")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contato" className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center">
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <a 
                  href="/docs/politica-privacidade.pdf" 
                  download="Politica_de_Privacidade_AraraAzul.pdf"
                  className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center"
                >
                  {t("footer.privacyPolicy")}
                </a>
              </li>
              <li>
                <a 
                  href="/docs/termos-de-uso.pdf" 
                  download="Termos_de_Uso_AraraAzul.pdf"
                  className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center"
                >
                  {t("footer.termsOfUse")}
                </a>
              </li>
              <li>
                <a 
                  href="/docs/politica-cancelamento.pdf" 
                  download="Politica_de_Cancelamento_AraraAzul.pdf"
                  className="opacity-90 hover:opacity-100 transition-opacity min-h-[44px] inline-flex items-center"
                >
                  {t("footer.cancellationPolicy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t("footer.contact")}</h4>
            <div className="space-y-3 text-sm">
              <a 
                href={`${SOCIAL_LINKS.whatsapp}?text=${whatsappMessage}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 opacity-90 hover:opacity-100 transition-opacity min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{SOCIAL_LINKS.whatsappNumber}</span>
              </a>
              <div className="flex items-center space-x-2 opacity-90">
                <Mail className="h-4 w-4" />
                <span>{SOCIAL_LINKS.email}</span>
              </div>
              <div className="flex space-x-4 mt-4">
                <a 
                  href={SOCIAL_LINKS.instagram}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-90 hover:opacity-100 transition-opacity p-2 -ml-2"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href={SOCIAL_LINKS.facebook}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-90 hover:opacity-100 transition-opacity p-2"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div className="text-center md:text-left opacity-80">
              <p>&copy; {new Date().getFullYear()} Pousada Arara Azul Ltda. {t("footer.allRightsReserved")}</p>
              <p className="text-xs mt-1 opacity-70">CNPJ: 00.000.000/0001-00</p>
            </div>
            
            {/* Admin Login Button */}
            {(isAdmin || isSuperAdmin) ? (
              <Link to="/admin">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary-foreground/70 hover:text-primary-foreground/100 text-xs min-h-[44px]"
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
                  className="text-primary-foreground/50 hover:text-primary-foreground/80 text-xs min-h-[44px]"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  Acesso Administrativo
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
