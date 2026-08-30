import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Facebook, Instagram, Mail, Shield, LogIn, MessageCircle, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/config/socialLinks";
import { createWhatsAppLink } from "@/lib/whatsapp";
import DeveloperCreditModal from "@/components/DeveloperCreditModal";

const Footer = () => {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();
  
  const whatsappUrl = createWhatsAppLink(t('whatsapp.availabilityInquiry'));

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-secondary to-accent py-6 sm:py-10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-white mb-2 sm:mb-3">
            {t('home.readyForAdventure')}
          </h3>
          <p className="text-white/90 mb-4 sm:mb-5 max-w-lg mx-auto text-xs sm:text-base">
            {t('home.bookNowDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 min-h-[44px] sm:min-h-[52px] px-6 sm:px-8 font-semibold shadow-lg text-sm sm:text-base"
              asChild
            >
              <Link to="/bangalos">
                {t('common.bookNow')}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10 min-h-[44px] sm:min-h-[52px] px-6 sm:px-8 w-full sm:w-auto text-sm sm:text-base"
              >
                <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer — mobile: single column compact, desktop: 4 cols */}
      <div className="container mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {/* Brand + Contact merged on mobile */}
          <div className="col-span-2 lg:col-span-1 min-w-0">
            <h3 className="text-sm sm:text-lg font-display font-bold mb-2">Pousada Arara Azul</h3>
            <div className="flex items-start gap-1.5 text-xs sm:text-sm opacity-90 mb-2">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{t("globals.location")}</span>
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <a 
                href={whatsappUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity py-0.5"
              >
                <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{SOCIAL_LINKS.whatsappNumber}</span>
              </a>
              <div className="flex items-center gap-1.5 opacity-90 py-0.5">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{SOCIAL_LINKS.email}</span>
              </div>
            </div>
            {/* Social icons */}
            <div className="flex gap-2 mt-2">
              <a 
                href={SOCIAL_LINKS.instagram}
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-90 hover:opacity-100 transition-opacity p-1.5"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a 
                href={SOCIAL_LINKS.facebook}
                target="_blank" 
                rel="noopener noreferrer"
                className="opacity-90 hover:opacity-100 transition-opacity p-1.5"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Links rápidos */}
          <div className="min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm mb-2">{t("nav.home")}</h4>
            <ul className="space-y-0.5 text-xs sm:text-sm">
              {[
                { to: "/", label: t("nav.home") },
                { to: "/bangalos", label: t("nav.lodges") },
                { to: "/pacotes", label: t("nav.packages") },
                { to: "/experiencias", label: t("nav.experiences") || "Experiências" },
                { to: "/como-chegar", label: t("nav.howToGetThere") },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="opacity-90 hover:opacity-100 transition-opacity inline-flex items-center py-1 min-h-[36px] sm:min-h-0 break-words">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sobre / Legal */}
          <div className="min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm mb-2">{t("footer.about")}</h4>
            <ul className="space-y-0.5 text-xs sm:text-sm">
              {[
                { to: "/contato", label: t("footer.contact") },
                { to: "/faq", label: t("footer.faq") },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="opacity-90 hover:opacity-100 transition-opacity inline-flex items-center py-1 min-h-[36px] sm:min-h-0 break-words">
                    {link.label}
                  </Link>
                </li>
              ))}
              {[
                { href: "/docs/politica-privacidade.pdf", label: t("footer.privacyPolicy") },
                { href: "/docs/termos-de-uso.pdf", label: t("footer.termsOfUse") },
                { href: "/docs/politica-cancelamento.pdf", label: t("footer.cancellationPolicy") },
                { href: "/docs/guia-pre-checkin-fnrh.pdf", label: t("footer.preCheckinGuide") },
              ].map((link) => (
                <li key={link.href}>
                  <a href={link.href} download className="opacity-90 hover:opacity-100 transition-opacity inline-flex items-center py-1 min-h-[36px] sm:min-h-0 break-words">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>


        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-4 sm:mt-6 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-center sm:text-left opacity-80">
              <p>&copy; {new Date().getFullYear()} Pousada Arara Azul Ltda. {t("footer.allRightsReserved")}</p>
              <p className="text-[10px] mt-0.5 opacity-70">CNPJ: 63.136.300/0001-12</p>
            </div>
            
            {(isAdmin || isSuperAdmin) ? (
              <Link to="/admin">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary-foreground/70 hover:text-primary-foreground/100 text-xs h-8"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {t("nav.admin")}
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary-foreground/50 hover:text-primary-foreground/80 text-xs h-8"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  {t("admin.adminAccess")}
                </Button>
              </Link>
            )}
          </div>

          {/* Developer credit */}
          <div className="mt-3 pt-3 border-t border-primary-foreground/10 text-center">
            <DeveloperCreditModal>
              <button
                type="button"
                className="text-[10px] sm:text-xs opacity-60 hover:opacity-100 transition-opacity underline-offset-2 hover:underline"
              >
                {t("footer.developedBy", { name: "Flávio A. Costa" })}
              </button>
            </DeveloperCreditModal>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
