import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Facebook, Instagram, Mail, Phone, Shield } from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-display font-bold mb-4">Pousadas Amazônia</h3>
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
              {(isAdmin || isSuperAdmin) && (
                <li>
                  <Link 
                    to="/admin" 
                    className="flex items-center opacity-70 hover:opacity-100 transition-opacity text-xs"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {t("admin.adminAccess")}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer.contact")}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 opacity-90">
                <Phone className="h-4 w-4" />
                <span>+55 92 3232-5050</span>
              </div>
              <div className="flex items-center space-x-2 opacity-90">
                <Mail className="h-4 w-4" />
                <span>contato@pousadasamazonia.com</span>
              </div>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
          <p>&copy; 2025 Pousadas Amazônia. {t("footer.allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
