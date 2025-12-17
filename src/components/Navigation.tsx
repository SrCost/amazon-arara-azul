import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, User, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import logoAraraAzul from "@/assets/logo-arara-azul.png";
import { Button } from "./ui/button";
import { SOCIAL_LINKS } from "@/config/socialLinks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: t("nav.home"), href: "/" },
    { label: "Bangalôs", href: "/bangalos" },
    { label: t("nav.packages"), href: "/pacotes" },
    { label: "Experiências", href: "/experiencias" },
    { label: t("nav.sustainability"), href: "/sustentabilidade" },
    { label: t("nav.howToGetThere"), href: "/como-chegar" },
    { label: t("nav.contact"), href: "/contato" },
  ];

  const languages = [
    { code: "pt", label: "Português" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3">
            <img
              src={logoAraraAzul}
              alt="Pousada Arara Azul"
              className="h-12 md:h-16 w-auto"
            />
            <h1 className="hidden md:block text-xl lg:text-2xl font-display font-bold text-primary">
              Pousada Arara Azul
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Instagram Link */}
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center hover:text-primary transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Globe className="h-4 w-4" />
                  <span>{i18n.language.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu - Only for authenticated admins */}
            {user && isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/admin">{t("nav.admin")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button 
              size="lg" 
              className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white min-h-[44px] px-6 font-semibold"
              asChild
            >
              <Link to="/bangalos">Reservar Agora</Link>
            </Button>
          </div>

          {/* Mobile Instagram + Menu button */}
          <div className="flex items-center gap-1 lg:hidden">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-foreground"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-3 border-t border-border max-h-[80vh] overflow-y-auto">
            {/* Navegação Principal */}
            <div className="px-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    location.pathname === item.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground hover:bg-muted"
                  } transition-colors`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Separador */}
            <div className="border-t border-border mx-3 my-2" />

            {/* Idiomas - Grid compacto 2x2 */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {t("nav.language")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium text-center ${
                      i18n.language === lang.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    } transition-colors`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin se aplicável */}
            {user && isAdmin && (
              <>
                <div className="border-t border-border mx-3 my-2" />
                <div className="px-2 py-2 space-y-1">
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    {t("nav.admin")}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              </>
            )}

            {/* Separador */}
            <div className="border-t border-border mx-3 my-2" />

            {/* Botão CTA */}
            <div className="px-3 pt-2 pb-1">
              <Button
                size="lg"
                asChild
                className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white min-h-[52px] font-semibold"
              >
                <Link to="/bangalos" onClick={() => setIsOpen(false)}>
                  Reservar Agora
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
