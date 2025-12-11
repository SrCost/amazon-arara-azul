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
            <h1 className="text-xl md:text-2xl font-display font-bold text-primary">
              Pousada Arara Azul
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
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

            <Button variant="default" size="lg" asChild>
              <Link to="/pousadas">{t("hero.bookNow")}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.href
                      ? "text-primary bg-muted"
                      : "text-foreground hover:bg-muted"
                  } transition-colors`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Language Selector Mobile */}
              <div className="border-t border-border pt-3 space-y-2">
                <p className="px-3 text-sm font-semibold text-muted-foreground">
                  {t("nav.language") || "Idioma"}
                </p>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                      i18n.language === lang.code
                        ? "bg-muted text-primary"
                        : "text-foreground hover:bg-muted"
                    } transition-colors`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {/* User Menu Mobile - Only for authenticated admins */}
              {user && isAdmin && (
                <div className="border-t border-border pt-3">
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {t("nav.admin")}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              )}

              <Button
                variant="default"
                size="lg"
                asChild
                className="w-full mt-4"
              >
                <Link to="/pousadas" onClick={() => setIsOpen(false)}>
                  {t("hero.bookNow")}
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
